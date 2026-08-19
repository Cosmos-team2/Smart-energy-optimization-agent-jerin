"""
Weather MCP — Open-Meteo
Fetches current conditions + hourly forecast for a facility location.
No API key required. Cache per (lat, lon) for 30 min — don't re-fetch on
every simulation tick, only at facility sign-up / hourly refresh.

Endpoint: GET /api/mcp/weather?lat=12.97&lon=77.59
"""

import time
from datetime import datetime, timezone
from typing import Optional
import requests
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from packages.contracts.models import MCPEnvelope, Location

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
USER_AGENT     = "cognizant-hackathon-energy-agent"
HEATWAVE_THRESHOLD_CELSIUS = 35.0
CACHE_TTL_SECONDS = 1800  # 30 min — one fetch per facility per half-hour is fine

# Simple in-memory cache: key=(lat_r, lon_r) → {"ts": float, "envelope": MCPEnvelope}
_cache: dict = {}


def _cache_key(lat: float, lon: float) -> tuple:
    # Round to 2 decimals so nearby coords share a cache entry
    return (round(lat, 2), round(lon, 2))


def get_weather(lat: float, lon: float) -> MCPEnvelope:
    """
    Fetch current conditions + 12-hour hourly forecast from Open-Meteo.
    Returns MCPEnvelope(source="open-meteo", ...) with:
      - current: temp_celsius, humidity_pct, apparent_temp, weather_code
      - forecast_next_12h: list of {time, temp_celsius, humidity_pct}
      - heatwave_flag: True if current temp > 35°C (used by tariff stress index)
    Result is cached per location for 30 minutes.
    """
    key = _cache_key(lat, lon)
    now = time.monotonic()

    # Return cached result if still fresh
    if key in _cache and (now - _cache[key]["ts"]) < CACHE_TTL_SECONDS:
        return _cache[key]["envelope"]

    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code",
        "hourly": "temperature_2m,relative_humidity_2m",
        "forecast_days": 1,
        "timezone": "Asia/Kolkata",
    }
    headers = {"User-Agent": USER_AGENT}

    resp = requests.get(OPEN_METEO_URL, params=params, headers=headers, timeout=10)
    resp.raise_for_status()
    data = resp.json()

    current = data.get("current", {})
    hourly  = data.get("hourly", {})

    current_temp = current.get("temperature_2m")
    current_humidity = current.get("relative_humidity_2m")

    # Package next 12 hourly forecast slots
    times  = hourly.get("time", [])[:12]
    temps  = hourly.get("temperature_2m", [])[:12]
    humids = hourly.get("relative_humidity_2m", [])[:12]
    forecast_next_12h = [
        {"time": t, "temp_celsius": tp, "humidity_pct": h}
        for t, tp, h in zip(times, temps, humids)
    ]

    timestamp_str = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S+05:30")

    payload = {
        "current": {
            "temp_celsius": current_temp,
            "humidity_pct": current_humidity,
            "apparent_temp_celsius": current.get("apparent_temperature"),
            "weather_code": current.get("weather_code"),
        },
        "forecast_next_12h": forecast_next_12h,
        "heatwave_flag": (current_temp > HEATWAVE_THRESHOLD_CELSIUS) if current_temp is not None else False,
        "heatwave_threshold_celsius": HEATWAVE_THRESHOLD_CELSIUS,
        "units": {"temperature": "celsius", "humidity": "percent"},
        "data_source": "open-meteo (no API key, real-time)",
    }

    envelope = MCPEnvelope(
        source="open-meteo",
        timestamp=timestamp_str,
        location=Location(lat=lat, lon=lon),
        payload=payload,
        confidence=0.95,
    )

    _cache[key] = {"ts": now, "envelope": envelope}
    return envelope
