# FastAPI Mock Server Spine (`apps/api`)

Lightweight FastAPI mock server providing canonical contract endpoints, MCP tool integrations, and DuckDB time-series analytics.

---

## 🚀 Prerequisites & Installation

Ensure Python 3.11+ is installed.

```bash
# Install dependencies
pip install -r apps/api/requirements.txt
```

---

## ⚡ Running the Mock Server locally on Port 8000

Make sure you are in the repository root directory (`Smart-energy-optimization-agent-jerin`).

### Command Prompt (cmd.exe)
```cmd
cd /d f:\Projects\cognizant\Smart-energy-optimization-agent-jerin
set PYTHONPATH=.
python -m uvicorn apps.api.main:app --reload --port 8000
```
*or directly via Python:*
```cmd
python apps/api/main.py
```

### PowerShell
```powershell
cd f:\Projects\cognizant\Smart-energy-optimization-agent-jerin
$env:PYTHONPATH="."
python -m uvicorn apps.api.main:app --reload --port 8000
```

---

## 📡 Live Endpoints

Once running, access the server at `http://127.0.0.1:8000`:

- **Interactive API Docs (Swagger UI)**: `http://127.0.0.1:8000/docs`
- **Health Check**: `GET http://127.0.0.1:8000/health`
- **Entity Model (Facility)**: `GET http://127.0.0.1:8000/api/facility/f_001`
- **Seed Readings**: `GET http://127.0.0.1:8000/api/readings?limit=100`
- **Recommendation Object**: `GET http://127.0.0.1:8000/api/recommendations/rec_042`
- **MCP Envelope Wrapper**: `POST http://127.0.0.1:8000/api/mcp/envelope`
- **MCP Geocoding (Nominatim)**: `GET http://127.0.0.1:8000/api/mcp/geocode?address=...`
- **MCP Tariff Rule Engine**: `GET http://127.0.0.1:8000/api/mcp/tariff?datetime_ist=...`
- **MCP Weather (Open-Meteo)**: `GET http://127.0.0.1:8000/api/mcp/weather?lat=...&lon=...`
- **MCP Solar (NASA POWER)**: `GET http://127.0.0.1:8000/api/mcp/solar?lat=...&lon=...`
- **DuckDB Analytics Readings**: `GET http://127.0.0.1:8000/api/analytics/readings?agg=raw|hourly|daily`
- **DuckDB Analytics Peak**: `GET http://127.0.0.1:8000/api/analytics/peak?facility_id=f_001`
- **WebSocket Telemetry Stream**: `WS ws://127.0.0.1:8000/ws/telemetry`
