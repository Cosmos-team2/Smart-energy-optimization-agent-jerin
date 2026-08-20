import asyncio
import json
import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List, Optional, Dict, Any, Literal

import httpx
import uvicorn
from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Robust REPO_ROOT resolution for Render / Docker / local execution
current_dir = Path(__file__).resolve().parent
REPO_ROOT = current_dir
for candidate in [current_dir, current_dir.parent, current_dir.parent.parent, current_dir.parent.parent.parent]:
    if (candidate / "packages").exists() or (candidate / "Model").exists() or (candidate / "requirements.txt").exists():
        REPO_ROOT = candidate
        break

# Add both current_dir and REPO_ROOT to sys.path
for p in [str(current_dir), str(REPO_ROOT)]:
    if p not in sys.path:
        sys.path.insert(0, p)

# Ensure PYTHONPATH environment variable includes paths
existing_pythonpath = os.environ.get("PYTHONPATH", "")
os.environ["PYTHONPATH"] = f"{REPO_ROOT}{os.pathsep}{current_dir}{os.pathsep}{existing_pythonpath}"

# 1. CONTRACT MODELS IMPORT WITH INLINE FALLBACKS
try:
    from packages.contracts.models import (
        Facility,
        Zone,
        Equipment,
        Location,
        RecommendationObject,
        MCPEnvelope,
        MCPEnvelopeRequest,
        WebSocketEvent,
        SeedDataRecord,
    )
except ImportError:
    class Location(BaseModel):
        lat: float = Field(..., description="Latitude")
        lon: float = Field(..., description="Longitude")

    class MCPEnvelope(BaseModel):
        source: str = Field(..., description="Source of context data")
        timestamp: str = Field(..., description="ISO 8601 IST timestamp")
        location: Optional[Location] = Field(None)
        payload: Dict[str, Any] = Field(default_factory=dict)
        confidence: float = Field(1.0, ge=0.0, le=1.0)

    class MCPEnvelopeRequest(BaseModel):
        source: str = Field("open-meteo")
        payload: Dict[str, Any] = Field(default_factory=dict)
        lat: float = Field(12.9716)
        lon: float = Field(77.5946)
        confidence: float = Field(0.95)

    class ActionDetail(BaseModel):
        action_type: str
        target_equipment: Optional[str] = None
        target_zone: Optional[str] = None
        delay_minutes: Optional[int] = None
        temp_delta_celsius: Optional[float] = None
        ramp_cap_pct: Optional[float] = None
        time_window: Optional[str] = None
        description: Optional[str] = None

    class RecommendationObject(BaseModel):
        id: str
        type: Literal["composite", "sequence", "shift", "solar_advisory"] = "composite"
        target: List[str] = Field(default_factory=list)
        actions: List[ActionDetail] = Field(default_factory=list)
        estimated_savings_inr: float = 130000.0
        spike_risk_reduction_pct: float = 62.5
        baseline_peak_kw: float = 777.71
        optimized_peak_kw: float = 420.0
        reasoning: str = "Pre-cool Zone 3 and stagger compressor startup"
        cited_rule: str = "demand_charge_15min_peak"
        confidence: float = 0.94
        requires_approval: bool = True
        status: Literal["proposed", "approved", "rejected", "executed"] = "proposed"

    class WebSocketEvent(BaseModel):
        event: Literal["reading", "alert", "recommendation", "approval_update", "status"]
        facility_id: str
        zone_id: Optional[str] = None
        timestamp: str
        payload: Dict[str, Any] = Field(default_factory=dict)

    class Equipment(BaseModel):
        id: str
        zone_id: str
        name: str
        type: str
        rated_power_kw: float

    class Zone(BaseModel):
        id: str
        facility_id: str
        name: str
        equipments: List[Equipment] = Field(default_factory=list)

    class Facility(BaseModel):
        id: str
        name: str
        address: str
        location: Optional[Location] = None
        zones: List[Zone] = Field(default_factory=list)

    class SeedDataRecord(BaseModel):
        Datetime: str
        PJME_MW: Optional[float] = None
        total_kw: float
        base_kw: float
        hvac_kw: float
        comp_kw: float
        is_spike_event: int = 0
        temp_celsius: float
        humidity_pct: float
        solar_ghi: float
        tod_rate_inr: float
        is_peak_hour_flag: int = 0
        demand_charge_rate_inr: float
        optimized_kw: Optional[float] = None

# 2. MCP IMPORTS WITH FALLBACKS
try:
    from apps.api.mcp.geocode import geocode_address
    from apps.api.mcp.tariff import get_tariff_envelope
    from apps.api.mcp.weather import get_weather
    from apps.api.mcp.solar import get_solar
except ImportError:
    try:
        from mcp.geocode import geocode_address
        from mcp.tariff import get_tariff_envelope
        from mcp.weather import get_weather
        from mcp.solar import get_solar
    except ImportError:
        def geocode_address(address: str):
            return MCPEnvelope(source="osm-nominatim", timestamp="2026-08-20T00:00:00+05:30", location=Location(lat=12.9716, lon=77.5946), payload={"address": address})
        def get_tariff_envelope(discom="BESCOM"):
            return MCPEnvelope(source="discom-tariff", timestamp="2026-08-20T00:00:00+05:30", payload={"discom": discom})
        def get_weather(lat=12.9716, lon=77.5946):
            return MCPEnvelope(source="open-meteo", timestamp="2026-08-20T00:00:00+05:30", payload={"temp_celsius": 28.5})
        def get_solar(lat=12.9716, lon=77.5946):
            return MCPEnvelope(source="nasa-power", timestamp="2026-08-20T00:00:00+05:30", payload={"ghi": 450.0})

# 3. ANALYTICS IMPORTS WITH FALLBACKS
try:
    from apps.api.analytics import query_readings, query_peak_reading
except ImportError:
    try:
        from analytics import query_readings, query_peak_reading
    except ImportError:
        def query_readings(limit=100, offset=0):
            return []
        def query_peak_reading():
            return None

# In-memory store for recommendation status overrides (keyed by rec id)
_rec_status_store: Dict[str, str] = {}


async def _keep_alive_task():
    """Pings our own /health endpoint every 10 minutes to prevent Render free-tier spin-down."""
    # Wait 60s after startup before first ping
    await asyncio.sleep(60)
    while True:
        try:
            port = int(os.environ.get("PORT", 10000))
            async with httpx.AsyncClient() as client:
                resp = await client.get(f"http://0.0.0.0:{port}/health", timeout=10.0)
                print(f"[KeepAlive] Self-ping responded: {resp.status_code}")
        except Exception as e:
            print(f"[KeepAlive] Self-ping failed (non-critical): {e}")
        await asyncio.sleep(600)  # 10 minutes


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start keep-alive background task on startup."""
    task = asyncio.create_task(_keep_alive_task())
    print("[Startup] Keep-alive background task started (pings /health every 10 min)")
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="Smart Energy Optimization Agent API",
    description="Backend serving energy optimization contracts, real seed data, MCP tools, and Groq AI copilot.",
    version="0.2.0",
    lifespan=lifespan,
)

# Enable CORS for Next.js frontend, 3D Digital Twin, and local dev clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Path to seed data files
SEED_DIR = REPO_ROOT / "packages" / "contracts" / "seed"
SEED_DATA_FILE = SEED_DIR / "seed_facility_data.json"
REC_042_FILE = SEED_DIR / "rec_042.json"

# In-memory fixture defaults
DEFAULT_FACILITY = Facility(
    id="f_001",
    name="Bengaluru Tech Park - Phase 2",
    address="Plot 42, Electronic City Phase 1, Bengaluru, Karnataka 560100",
    location=Location(lat=12.9716, lon=77.5946),
    zones=[
        Zone(
            id="z_hvac_3",
            facility_id="f_001",
            name="HVAC Chillers Zone 3",
            equipments=[
                Equipment(
                    id="eq_chiller_2",
                    zone_id="z_hvac_3",
                    name="Centrifugal Chiller #2",
                    type="hvac",
                    rated_power_kw=180.0,
                )
            ],
        ),
        Zone(
            id="z_compressor_1",
            facility_id="f_001",
            name="Compressed Air Station 1",
            equipments=[
                Equipment(
                    id="eq_comp_1",
                    zone_id="z_compressor_1",
                    name="Screw Air Compressor #1",
                    type="compressor",
                    rated_power_kw=140.0,
                )
            ],
        ),
    ],
)


@app.get("/")
def read_root():
    return {
        "app": "Smart Energy Consumption Optimization Agent Mock Spine",
        "status": "running",
        "docs": "/docs",
        "contracts": [
            "Entity Model (Facility, Zone, Equipment)",
            "WebSocket Event",
            "Recommendation Object",
            "MCP Tool Envelope",
            "Seed Dataset",
        ],
    }


@app.get("/health")
def health_check():
    return {"status": "ok", "version": "0.1.0"}


@app.get("/api/facility/{facility_id}", response_model=Facility)
def get_facility(facility_id: str):
    """Return entity model for facility (Contract 1)."""
    if facility_id == "f_001":
        return DEFAULT_FACILITY
    return Facility(
        id=facility_id,
        name=f"Facility {facility_id}",
        address="123 Industrial Estate, Commercial Hub, India",
        location=Location(lat=12.97, lon=77.59),
        zones=[
            Zone(
                id="z_hvac_1",
                facility_id=facility_id,
                name="Main HVAC Zone",
                equipments=[
                    Equipment(
                        id="eq_hvac_1",
                        zone_id="z_hvac_1",
                        name="Chiller #1",
                        type="hvac",
                        rated_power_kw=150.0,
                    )
                ],
            )
        ],
    )


@app.get("/api/readings", response_model=List[SeedDataRecord])
def get_readings(
    limit: int = Query(100, ge=1, le=5000, description="Number of readings to return"),
    offset: int = Query(0, ge=0, description="Offset in seed dataset"),
):
    """Return seed dataset readings from real Kaggle/Open-Meteo rescaled fixture (Contract 5)."""
    if SEED_DATA_FILE.exists():
        try:
            with open(SEED_DATA_FILE, "r", encoding="utf-8") as f:
                raw_data = json.load(f)
            sliced_data = raw_data[offset : offset + limit]
            return [SeedDataRecord(**item) for item in sliced_data]
        except Exception as e:
            print(f"[Readings Warning] Error reading seed file: {e}")
    # Inline fallback seed data
    fallback_records = [
        SeedDataRecord(Datetime="00:00", total_kw=210, base_kw=140, hvac_kw=45, comp_kw=25, is_spike_event=0, temp_celsius=24.2, humidity_pct=70, solar_ghi=0, tod_rate_inr=4.5, is_peak_hour_flag=0, demand_charge_rate_inr=450, optimized_kw=210),
        SeedDataRecord(Datetime="06:00", total_kw=777.71, base_kw=240, hvac_kw=280, comp_kw=257.71, is_spike_event=1, temp_celsius=26.0, humidity_pct=65, solar_ghi=210, tod_rate_inr=9.85, is_peak_hour_flag=1, demand_charge_rate_inr=450, optimized_kw=420.0),
        SeedDataRecord(Datetime="12:00", total_kw=460, base_kw=210, hvac_kw=180, comp_kw=70, is_spike_event=0, temp_celsius=35.2, humidity_pct=45, solar_ghi=940, tod_rate_inr=7.5, is_peak_hour_flag=0, demand_charge_rate_inr=450, optimized_kw=430.0),
    ]
    return fallback_records[offset : offset + limit]


@app.get("/api/recommendations/rec_042", response_model=RecommendationObject)
def get_recommendation_rec_042():
    """Return canonical rec_042 recommendation object fixture (Contract 3)."""
    if REC_042_FILE.exists():
        try:
            with open(REC_042_FILE, "r", encoding="utf-8") as f:
                raw_data = json.load(f)
            rec = RecommendationObject(**raw_data)
            if rec.id in _rec_status_store:
                rec = rec.model_copy(update={"status": _rec_status_store[rec.id]})
            return rec
        except Exception as e:
            print(f"[Rec042 Warning] Error parsing rec_042.json: {e}")
    # Inline fallback recommendation object
    status_val = _rec_status_store.get("rec_042", "proposed")
    return RecommendationObject(
        id="rec_042",
        type="composite",
        target=["z_hvac_3", "z_compressor_1"],
        actions=[
            ActionDetail(action_type="pre_cool", target_zone="z_hvac_3", temp_delta_celsius=-1.5, time_window="05:00-05:45 AM", description="Pre-cool Zone 3 by 1.5°C before tariff peak to build thermal inertia"),
            ActionDetail(action_type="delay_start", target_equipment="eq_comp_1", delay_minutes=20, time_window="06:00-06:20 AM", description="Stagger Screw Air Compressor #1 startup by 20 mins to prevent simultaneous inrush"),
            ActionDetail(action_type="soft_ramp", target_equipment="eq_chiller_2", ramp_cap_pct=50.0, time_window="06:00-06:15 AM", description="Soft-ramp Centrifugal Chiller #2 capped at 50% capacity during grid ramp window"),
        ],
        estimated_savings_inr=130000.0,
        spike_risk_reduction_pct=62.5,
        baseline_peak_kw=777.71,
        optimized_peak_kw=420.0,
        reasoning="Simultaneous restart of Chiller #2 (+180 kW) and Compressor #1 (+140 kW) creates a 777.71 kW demand spike between 06:00-06:15 AM, exceeding the 500.0 kW contract limit. Staggering compressor restart to 06:20 AM and pre-cooling Zone HVAC-3 reduces peak load to 420.0 kW.",
        cited_rule="demand_charge_15min_peak",
        confidence=0.94,
        requires_approval=True,
        status=status_val,
    )


@app.get("/api/recommendations", response_model=List[RecommendationObject])
def list_recommendations():
    """Return list of recommendations (Contract 3)."""
    return [get_recommendation_rec_042()]


@app.post("/api/recommendations/{rec_id}/approve", response_model=RecommendationObject)
def approve_recommendation(rec_id: str):
    """
    Human approval gate: marks a recommendation as approved.
    Updates in-memory status store and returns the updated RecommendationObject (Contract 3).
    """
    if not REC_042_FILE.exists():
        raise HTTPException(status_code=404, detail="rec_042.json not found")
    try:
        with open(REC_042_FILE, "r", encoding="utf-8") as f:
            rec_data = json.load(f)
        rec = RecommendationObject(**rec_data)
        if rec.id != rec_id:
            raise HTTPException(status_code=404, detail=f"Recommendation '{rec_id}' not found")
        _rec_status_store[rec_id] = "approved"
        return rec.model_copy(update={"status": "approved"})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Approval failed: {str(e)}")


@app.post("/api/recommendations/{rec_id}/reject", response_model=RecommendationObject)
def reject_recommendation(rec_id: str):
    """
    Human approval gate: marks a recommendation as rejected.
    Updates in-memory status store and returns the updated RecommendationObject (Contract 3).
    """
    if not REC_042_FILE.exists():
        raise HTTPException(status_code=404, detail="rec_042.json not found")
    try:
        with open(REC_042_FILE, "r", encoding="utf-8") as f:
            rec_data = json.load(f)
        rec = RecommendationObject(**rec_data)
        if rec.id != rec_id:
            raise HTTPException(status_code=404, detail=f"Recommendation '{rec_id}' not found")
        _rec_status_store[rec_id] = "rejected"
        return rec.model_copy(update={"status": "rejected"})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rejection failed: {str(e)}")


@app.post("/api/mcp/envelope", response_model=MCPEnvelope)
def create_mcp_envelope(body: MCPEnvelopeRequest):
    """Wrap raw tool data into standard MCP Envelope (Contract 4)."""
    return MCPEnvelope(
        source=body.source,
        timestamp="2026-08-14T06:00:00+05:30",
        location=Location(lat=body.lat, lon=body.lon),
        payload={
            "temp_celsius": body.payload.get("temp_celsius", 38.0),
            "humidity_pct": body.payload.get("humidity_pct", 45.0),
            "solar_ghi": body.payload.get("solar_ghi", 742.0),
            "tod_rate_inr": body.payload.get("tod_rate_inr", 9.85),
            "demand_charge_rate_inr": body.payload.get("demand_charge_rate_inr", 450.0),
        },
        confidence=body.confidence,
    )


@app.get("/api/mcp/geocode", response_model=MCPEnvelope)
def geocode(address: str = Query(..., description="Free-text address to geocode e.g. 'Electronic City, Bengaluru'")):
    """Geocode an address via OSM Nominatim and return MCPEnvelope (Contract 4)."""
    try:
        return geocode_address(address)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Nominatim geocoding failed: {str(e)}")


@app.get("/api/mcp/tariff", response_model=MCPEnvelope)
def tariff(
    datetime_ist: Optional[str] = Query(
        None,
        description="IST datetime string (ISO 8601) to evaluate tariff for. Defaults to now.",
        example="2026-08-14T06:00:00+05:30",
    ),
    ambient_temp_celsius: Optional[float] = Query(
        None,
        description="Ambient temperature in Celsius for stress index (omit to skip thermal factor).",
        example=38.0,
    ),
    lat: Optional[float] = Query(None, description="Facility latitude for envelope location field."),
    lon: Optional[float] = Query(None, description="Facility longitude for envelope location field."),
):
    """
    Evaluate DISCOM tariff rules + stress index for a given IST datetime (Contract 4).
    Deterministic — no external API. Source: BESCOM Karnataka ToD schedule.
    Stress index is a derived heuristic (peak_hour + heatwave), not live telemetry.
    """
    from datetime import datetime as dt_cls, timezone
    try:
        if datetime_ist:
            from datetime import datetime as dt_cls
            parsed = dt_cls.fromisoformat(datetime_ist)
        else:
            from zoneinfo import ZoneInfo
            parsed = dt_cls.now(ZoneInfo("Asia/Kolkata"))
        loc = Location(lat=lat, lon=lon) if (lat is not None and lon is not None) else None
        return get_tariff_envelope(dt=parsed, ambient_temp_celsius=ambient_temp_celsius, location=loc)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Tariff evaluation failed: {str(e)}")


@app.get("/api/mcp/weather", response_model=MCPEnvelope)
def weather(
    lat: float = Query(..., description="Facility latitude", example=12.9716),
    lon: float = Query(..., description="Facility longitude", example=77.5946),
):
    """
    Fetch current weather + 12h forecast from Open-Meteo (Contract 4).
    No API key required. Cached per location for 30 minutes — call once
    at facility sign-up, not on every simulation tick.
    Payload includes heatwave_flag for use by tariff stress index.
    """
    try:
        return get_weather(lat=lat, lon=lon)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Open-Meteo fetch failed: {str(e)}")


@app.get("/api/mcp/solar", response_model=MCPEnvelope)
def solar(
    lat: float = Query(..., description="Facility latitude", example=12.9716),
    lon: float = Query(..., description="Facility longitude", example=77.5946),
):
    """
    Fetch hourly GHI solar irradiance profile from NASA POWER (Contract 4).
    No API key required. Returns yesterday's hourly GHI as the site solar profile.
    Cached per location for 30 minutes — fetch once at sign-up, not per tick.
    Frame as 'site solar profile', not live sensor data.
    """
    try:
        return get_solar(lat=lat, lon=lon)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"NASA POWER fetch failed: {str(e)}")


# ==========================================
# DuckDB Analytics Endpoints (/api/analytics)
# ==========================================

@app.get("/api/analytics/readings")
def analytics_readings(
    facility_id: Optional[str] = Query(None, description="Facility ID filter e.g. 'f_001'"),
    zone_id: Optional[str] = Query(None, description="Zone ID filter e.g. 'z_hvac_3'"),
    start: Optional[str] = Query(None, description="Start timestamp filter e.g. '2017-01-01T00:00:00'"),
    end: Optional[str] = Query(None, description="End timestamp filter e.g. '2017-01-02T23:59:59'"),
    agg: Literal["raw", "hourly", "daily"] = Query("raw", description="Time aggregation bucket: raw, hourly, daily"),
    limit: int = Query(500, ge=1, le=5000, description="Max rows to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
):
    """
    DuckDB-powered analytics query endpoint with SQL filtering and time-bucket aggregation.
    Read-only against apps/api/db/energy.duckdb.
    """
    try:
        return query_readings(
            facility_id=facility_id,
            zone_id=zone_id,
            start=start,
            end=end,
            agg=agg,
            limit=limit,
            offset=offset,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"DuckDB query failed: {str(e)}")


@app.get("/api/analytics/peak")
def analytics_peak(
    facility_id: Optional[str] = Query(None, description="Facility ID filter e.g. 'f_001'"),
):
    """
    Returns the single highest 15-min peak demand reading + timestamp for ROI / demand charge calculations.
    Read-only query executed via DuckDB.
    """
    try:
        result = query_peak_reading(facility_id=facility_id)
        if not result:
            raise HTTPException(status_code=404, detail="No readings found for facility")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Peak demand query failed: {str(e)}")


# ==========================================
# Agent Copilot Endpoint (/api/copilot)
# ==========================================

class CopilotRequest(BaseModel):
    question: str = Field(..., description="User's natural language question (why/what-if)")
    state: Optional[Dict[str, Any]] = Field(None, description="Optional agent state snapshot; if omitted the current recommendation is fetched from rec_042")


@app.post("/api/copilot")
def copilot_endpoint(body: CopilotRequest):
    """
    AI Copilot: routes user questions to the energy agent graph.
    Supports 'why' questions (grounded explanation) and 'what-if' scenarios
    (re-runs MILP optimizer with parameter override).
    Requires GROQ_API_KEY or GEMINI_API_KEY environment variable.
    """
    try:
        from apps.agents.copilot import copilot_answer
        from apps.agents.graph import EnergyState

        # Build state: use caller-provided state or fall back to rec_042 fixture
        if body.state:
            state: Dict[str, Any] = body.state
        else:
            if REC_042_FILE.exists():
                with open(REC_042_FILE, "r", encoding="utf-8") as f:
                    rec_data = json.load(f)
            else:
                rec_data = {
                    "id": "rec_042",
                    "type": "composite",
                    "target": ["z_hvac_3", "z_compressor_1"],
                    "estimated_savings_inr": 130000.0,
                    "spike_risk_reduction_pct": 62.5,
                    "baseline_peak_kw": 777.71,
                    "optimized_peak_kw": 420.0,
                    "cited_rule": "demand_charge_15min_peak",
                }
            state = {
                "recommendation": rec_data,
                "tariff_context": {
                    "rules": [{"cited_rule": rec_data.get("cited_rule", "demand_charge_15min_peak"), "threshold_kw": rec_data.get("optimized_peak_kw", 420.0)}]
                },
                "readings": [],
                "anomaly_detected": True,
            }

        try:
            from apps.agents.copilot import copilot_answer
            answer = copilot_answer(body.question, state)
            return {"answer": answer, "intent_routed": True}
        except Exception as _agent_err:
            print(f"[Copilot Warning] Agent graph invocation failed: {_agent_err}, using grounded fallback response")
            fallback_answer = (
                f"Based on recommendation rec_042 for Bengaluru Tech Park - Phase 2: Simultaneous start of "
                f"Centrifugal Chiller #2 (+180 kW) and Screw Air Compressor #1 (+140 kW) at 06:00 AM created a "
                f"777.71 kW peak demand spike, exceeding the 500.0 kW BESCOM contract demand limit. Staggering compressor "
                f"startup to 06:20 AM and pre-cooling Zone 3 by 1.5°C limits peak load to 420.0 kW, saving ₹1,30,000/month "
                f"under BESCOM rule demand_charge_15min_peak."
            )
            return {"answer": fallback_answer, "intent_routed": False}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Copilot error: {str(e)}")


@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    """Mock WebSocket telemetry stream emitting WebSocketEvents (Contract 2)."""
    await websocket.accept()
    try:
        readings = []
        if SEED_DATA_FILE.exists():
            with open(SEED_DATA_FILE, "r", encoding="utf-8") as f:
                readings = json.load(f)

        idx = 0
        while True:
            reading = readings[idx % len(readings)] if readings else {}
            event = WebSocketEvent(
                event="reading",
                facility_id="f_001",
                zone_id="z_hvac_3",
                timestamp=reading.get("Datetime", "2026-08-14T06:00:00+05:30"),
                payload=reading,
            )
            await websocket.send_text(event.model_dump_json())
            idx += 1
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        pass


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
