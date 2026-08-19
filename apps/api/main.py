import json
import os
import sys
from pathlib import Path
from typing import List, Optional, Dict, Any

import uvicorn
from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# Add repository root to python path to resolve packages.contracts.models across child processes
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

# Ensure PYTHONPATH environment variable includes REPO_ROOT for uvicorn reloader subprocesses
existing_pythonpath = os.environ.get("PYTHONPATH", "")
if str(REPO_ROOT) not in existing_pythonpath.split(os.pathsep):
    os.environ["PYTHONPATH"] = f"{REPO_ROOT}{os.pathsep}{existing_pythonpath}" if existing_pythonpath else str(REPO_ROOT)

from packages.contracts.models import (
    Facility,
    Zone,
    Equipment,
    Location,
    RecommendationObject,
    MCPEnvelope,
    WebSocketEvent,
    SeedDataRecord,
)

app = FastAPI(
    title="Smart Energy Optimization Agent - Mock API Spine",
    description="Lightweight mock backend serving canonical 5 contracts and real seed fixture data for hackathon track integration.",
    version="0.1.0",
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
    if not SEED_DATA_FILE.exists():
        raise HTTPException(status_code=404, detail="seed_facility_data.json not found")
    try:
        with open(SEED_DATA_FILE, "r", encoding="utf-8") as f:
            raw_data = json.load(f)
        sliced_data = raw_data[offset : offset + limit]
        return [SeedDataRecord(**item) for item in sliced_data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read seed data: {str(e)}")


@app.get("/api/recommendations/rec_042", response_model=RecommendationObject)
def get_recommendation_rec_042():
    """Return canonical rec_042 recommendation object fixture (Contract 3)."""
    if not REC_042_FILE.exists():
        raise HTTPException(status_code=404, detail="rec_042.json not found")
    try:
        with open(REC_042_FILE, "r", encoding="utf-8") as f:
            raw_data = json.load(f)
        return RecommendationObject(**raw_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse rec_042.json: {str(e)}")


@app.get("/api/recommendations", response_model=List[RecommendationObject])
def list_recommendations():
    """Return list of recommendations (Contract 3)."""
    if REC_042_FILE.exists():
        with open(REC_042_FILE, "r", encoding="utf-8") as f:
            rec_data = json.load(f)
        return [RecommendationObject(**rec_data)]
    return []


@app.post("/api/mcp/envelope", response_model=MCPEnvelope)
def create_mcp_envelope(
    source: str = "open-meteo",
    payload: Dict[str, Any] = None,
    lat: float = 12.9716,
    lon: float = 77.5946,
    confidence: float = 0.95,
):
    """Wrap raw tool data into standard MCP Envelope (Contract 4)."""
    return MCPEnvelope(
        source=source,
        timestamp="2026-08-14T06:00:00+05:30",
        location=Location(lat=lat, lon=lon),
        payload=payload or {"temp_celsius": 38.0, "humidity_pct": 45.0},
        confidence=confidence,
    )


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
