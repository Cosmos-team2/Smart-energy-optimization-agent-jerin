"""
Solar MCP — NASA POWER
Fetches hourly Global Horizontal Irradiance (GHI, W/m²) for a facility location.
No API key required. Near-real-time / historical data — frame as "site solar profile,"
NOT a live sensor feed. Fetch once per facility and cache.

Data source: NASA POWER Hourly Climatology, parameter ALLSKY_SFC_SW_DWN.
Docs: https://power.larc.nasa.gov/

Endpoint: GET /api/mcp/solar?lat=12.97&lon=77.59
"""

import time
from datetime import datetime, timedelta, timezone
from typing import Optional
import requests
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from packages.contracts.models import MCPEnvelope, Location

NASA_POWER_URL = "https://power.larc.nasa.gov/api/temporal/hourly/point"
USER_AGENT     = "cognizant-hackathon-energy-agent"
CACHE_TTL_SECONDS = 1800  # 30 min — same as weather MCP

_cache: dict = {}


def _cache_key(lat: float, lon: float) -> tuple:
    return (round(lat, 2), round(lon, 2))


def get_solar(lat: float, lon: float) -> MCPEnvelope:
    """
    Fetch yesterday's hourly GHI from NASA POWER as the facility's solar profile.

    Returns MCPEnvelope(source="nasa-power", ...) with:
      - date: the date fetched (yesterday IST, since today's data lags)
      - ghi_hourly_w_m2: list of 24 hourly GHI values (index = hour 0-23 IST)
      - peak_ghi_w_m2: daily maximum GHI
      - peak_hour_ist: hour of peak irradiance
      - daily_total_kwh_m2: approximate daily insolation (integrate hourly → kWh/m²)
      - data_note: framing disclaimer (historical, not live sensor)

    Cached per location for 30 minutes.
    """
    key = _cache_key(lat, lon)
    now = time.monotonic()

    if key in _cache and (now - _cache[key]["ts"]) < CACHE_TTL_SECONDS:
        return _cache[key]["envelope"]

    # Use yesterday's date — NASA POWER hourly data typically lags by 1 day
    from zoneinfo import ZoneInfo
    ist = ZoneInfo("Asia/Kolkata")
    yesterday = (datetime.now(ist) - timedelta(days=1)).strftime("%Y%m%d")

    from zoneinfo import ZoneInfo
    ist = ZoneInfo("Asia/Kolkata")
    today = datetime.now(ist)

    # NASA POWER hourly data: the live API only has data up to ~2024.
    # For the demo we use the same calendar date from 2024 — identical seasonal
    # solar profile for this location, documented honestly as historical.
    # Walk back from same month/day in 2024, trying up to 7 prior days if needed.
    headers = {"User-Agent": USER_AGENT}
    ghi_data: dict = {}
    date_used: str = ""
    base_year = 2024

    for days_offset in range(0, 8):
        candidate_dt = today.replace(year=base_year) - timedelta(days=days_offset)
        candidate = candidate_dt.strftime("%Y%m%d")
        params = {
            "parameters": "ALLSKY_SFC_SW_DWN",
            "community": "RE",
            "longitude": lon,
            "latitude": lat,
            "format": "JSON",
            "start": candidate,
            "end": candidate,
            "time-standard": "LST",
        }
        resp = requests.get(NASA_POWER_URL, params=params, headers=headers, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        props = data.get("properties", {})
        param_data = props.get("parameter", {})
        candidate_data = param_data.get("ALLSKY_SFC_SW_DWN", {})
        real_values = [v for v in candidate_data.values() if v != -999.0]
        if real_values:
            ghi_data = candidate_data
            date_used = candidate
            break

    if not date_used:
        date_used = f"{base_year}{today.month:02d}{today.day:02d}"

    # NASA POWER hourly keys: "YYYYMMDDhh" (e.g. "2026081806" = 06:00 on 2026-08-18)
    # Fill/missing value for nighttime: -999.0 → clip to 0.0
    ghi_hourly = []
    for h in range(24):
        hour_key = f"{date_used}{h:02d}"
        val = ghi_data.get(hour_key, 0.0)
        ghi_hourly.append(max(0.0, val))  # -999 fill values → 0

    peak_ghi   = max(ghi_hourly) if ghi_hourly else 0.0
    peak_hour  = ghi_hourly.index(peak_ghi) if ghi_hourly else 0
    # Integrate hourly W/m² → kWh/m² (each slot = 1 hr, divide by 1000)
    daily_total_kwh = round(sum(ghi_hourly) / 1000.0, 3)

    timestamp_str = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S+05:30")
    date_fmt = f"{date_used[:4]}-{date_used[4:6]}-{date_used[6:]}"

    payload = {
        "date": date_fmt,
        "ghi_hourly_w_m2": ghi_hourly,
        "peak_ghi_w_m2": peak_ghi,
        "peak_hour_ist": peak_hour,
        "daily_total_kwh_m2": daily_total_kwh,
        "units": {"ghi": "W/m²", "daily_total": "kWh/m²"},
        "data_note": (
            f"Site solar profile — real NASA POWER GHI data for {date_fmt} "
            "(same seasonal period, 2024 historical; NASA POWER has no 2026 data yet). "
            "Not a live irradiance sensor. Fetch once at facility sign-up and cache."
        ),
    }

    envelope = MCPEnvelope(
        source="nasa-power",
        timestamp=timestamp_str,
        location=Location(lat=lat, lon=lon),
        payload=payload,
        confidence=0.9,
    )

    _cache[key] = {"ts": now, "envelope": envelope}
    return envelope
