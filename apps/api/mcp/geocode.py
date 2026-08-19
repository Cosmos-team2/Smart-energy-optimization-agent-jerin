"""
Geocoding MCP — OSM Nominatim
Wraps address → lat/lon lookup in the shared MCPEnvelope contract.
No API key required. One call per facility sign-up, not a hot path.
"""

from datetime import datetime, timezone
import requests

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from packages.contracts.models import MCPEnvelope, Location

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "cognizant-hackathon-energy-agent"


def geocode_address(address: str) -> MCPEnvelope:
    """
    Geocode a free-text address via OSM Nominatim.
    Returns MCPEnvelope(source="nominatim", location={lat,lon}, ...).
    confidence=1.0 if a match is found, 0.0 if not.
    """
    params = {"q": address, "format": "json", "limit": 1}
    headers = {"User-Agent": USER_AGENT}

    resp = requests.get(NOMINATIM_URL, params=params, headers=headers, timeout=10)
    resp.raise_for_status()
    results = resp.json()

    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S+05:30")

    if not results:
        return MCPEnvelope(
            source="nominatim",
            timestamp=timestamp,
            location=None,
            payload={"query": address, "match": None},
            confidence=0.0,
        )

    top = results[0]
    return MCPEnvelope(
        source="nominatim",
        timestamp=timestamp,
        location=Location(lat=float(top["lat"]), lon=float(top["lon"])),
        payload={
            "query": address,
            "display_name": top.get("display_name"),
            "osm_type": top.get("osm_type"),
            "osm_id": top.get("osm_id"),
            "type": top.get("type"),
            "importance": top.get("importance"),
        },
        confidence=1.0,
    )
