"""
Grid & Tariff MCP — DISCOM Deterministic Rule Engine
Source: Karnataka BESCOM-style ToD tariff (encoded, no external API).

ToD Windows (IST):
  Off-peak : 00:00–05:59 and 22:00–23:59 → ₹6.5/kWh
  Normal   : 06:00–17:59                 → ₹8.0/kWh
  Peak     : 18:00–21:59                 → ₹10.5/kWh, is_peak_hour=True

Demand charge: ₹500/kW on the single highest 15-min demand in the billing cycle.

Stress Index (derived heuristic, NOT live telemetry):
  Low    → not peak hour AND ambient_temp ≤ heatwave threshold
  Medium → peak hour OR ambient_temp > heatwave threshold (but not both)
  High   → peak hour AND ambient_temp > heatwave threshold
"""

from datetime import datetime, timezone
from typing import Optional, Literal
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from packages.contracts.models import MCPEnvelope, Location

# -------------------------------------------------------------------
# Tariff constants (BESCOM Karnataka approximation, hackathon-calibrated
# to match seed_facility_data.json — don't change without team sync)
# -------------------------------------------------------------------
TOD_WINDOWS = [
    # (start_hour_inclusive, end_hour_exclusive, window_name, inr_per_kwh)
    (0,  6,  "off-peak", 6.5),
    (6,  18, "normal",   8.0),
    (18, 22, "peak",     10.5),
    (22, 24, "off-peak", 6.5),
]
DEMAND_CHARGE_RATE_INR_PER_KW = 500.0
CONTRACTED_DEMAND_LIMIT_KW    = 500.0
CITED_RULE                    = "demand_charge_15min_peak"
HEATWAVE_THRESHOLD_CELSIUS    = 35.0

StressLevel = Literal["Low", "Medium", "High"]


def _get_tod(hour: int) -> tuple[str, float, bool]:
    """Return (window_name, inr_per_kwh, is_peak_hour) for a given IST hour (0-23)."""
    for start, end, name, rate in TOD_WINDOWS:
        if start <= hour < end:
            return name, rate, (name == "peak")
    return "off-peak", 6.5, False  # fallback


def _stress_index(is_peak_hour: bool, ambient_temp: Optional[float]) -> StressLevel:
    """
    Derived resilience heuristic combining grid-side demand pressure
    (peak tariff window) with thermal demand pressure (heatwave).
    Documented as derived, not live telemetry.
    """
    hot = (ambient_temp is not None) and (ambient_temp > HEATWAVE_THRESHOLD_CELSIUS)
    if is_peak_hour and hot:
        return "High"
    if is_peak_hour or hot:
        return "Medium"
    return "Low"


def get_tariff_envelope(
    dt: Optional[datetime] = None,
    ambient_temp_celsius: Optional[float] = None,
    location: Optional[Location] = None,
) -> MCPEnvelope:
    """
    Main entry point. Returns MCPEnvelope with tariff rule evaluation
    for the given IST datetime and optional ambient temperature.

    Args:
        dt: IST datetime to evaluate (defaults to now).
        ambient_temp_celsius: Ambient temperature for stress index calculation.
            Pass None to omit the stress index temperature factor.
        location: Optional facility Location for the envelope.
    """
    if dt is None:
        dt = datetime.now(timezone.utc)

    hour_ist = dt.hour  # Caller must pass IST-aware datetime
    timestamp_str = dt.strftime("%Y-%m-%dT%H:%M:%S+05:30")

    tod_window, tod_rate, is_peak = _get_tod(hour_ist)
    stress = _stress_index(is_peak, ambient_temp_celsius)

    payload = {
        "datetime_ist": timestamp_str,
        "tod_window": tod_window,
        "tod_rate_inr_per_kwh": tod_rate,
        "demand_charge_rate_inr_per_kw": DEMAND_CHARGE_RATE_INR_PER_KW,
        "contracted_demand_limit_kw": CONTRACTED_DEMAND_LIMIT_KW,
        "is_peak_hour": is_peak,
        "stress_index": stress,
        "stress_factors": {
            "is_peak_hour": is_peak,
            "ambient_temp_celsius": ambient_temp_celsius,
            "heatwave_threshold_celsius": HEATWAVE_THRESHOLD_CELSIUS,
            "above_heatwave_threshold": (
                (ambient_temp_celsius > HEATWAVE_THRESHOLD_CELSIUS)
                if ambient_temp_celsius is not None else None
            ),
        },
        "cited_rule": CITED_RULE,
        "note": (
            "stress_index is a derived heuristic (peak_hour + heatwave_temp), "
            "not live grid telemetry."
        ),
    }

    return MCPEnvelope(
        source="discom-rules",
        timestamp=timestamp_str,
        location=location,
        payload=payload,
        confidence=1.0,
    )
