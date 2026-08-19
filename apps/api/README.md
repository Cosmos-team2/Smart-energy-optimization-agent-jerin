# FastAPI Mock Server Spine (`apps/api`)

Lightweight FastAPI mock server providing canonical contract endpoints and serving real seed dataset fixtures (`seed_facility_data.json` & `rec_042.json`).

---

## 🚀 Prerequisites & Installation

Ensure Python 3.11+ is installed.

```bash
# Install dependencies
pip install fastapi uvicorn pydantic
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
- **MCP Envelope**: `POST http://127.0.0.1:8000/api/mcp/envelope`
- **WebSocket Telemetry Stream**: `WS ws://127.0.0.1:8000/ws/telemetry`
