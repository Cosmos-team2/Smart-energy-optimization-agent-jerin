# Project Context — Smart Energy Consumption Optimization Agent

Paste this at the start of any Claude session working on this project, or save as `CLAUDE.md` in the repo root for Claude Code to auto-load.

## What we're building

Cognizant Hackathon Use Case #10. An agentic AI system for Indian commercial campuses and mid-size factories that **don't have a Building Management System** — the segment every global competitor (BrainBox AI, Schneider EcoStruxure, Verdigris, Facilio) ignores because they assume expensive automation infrastructure already exists.

**The core insight, say this exactly if generating pitch/explainer content:** energy cost inflation is a *timing* problem, not a volume problem. Indian DISCOMs bill maximum demand charges on the single highest 15-minute power peak in a billing cycle. Simultaneous equipment startup (HVAC chillers, air compressors, motor inrush) creates artificial spikes that inflate the entire month's fixed charges. The system's job is load staggering and peak shaving via solver-grounded agentic reasoning — not generic "energy conservation."

## Today's constraint — read this before suggesting anything

**We have one day, not one week.** Optimize every suggestion for "works and is demo-able in hours," not "architecturally ideal." Don't propose refactors, don't suggest adding new abstraction layers, don't recommend "do this properly later" unless explicitly asked. If something can be mocked/stubbed to unblock a teammate faster, mock it. Contracts freeze at hour 6 of the day — after that, schema changes need a Slack sync with the team, don't just make them.

## Architecture

```
Facility sign-up (just an address)
   → Geocode (OSM Nominatim)
   → fan out to context MCPs, in parallel:
        • Weather MCP        (Open-Meteo, no key)
        • Solar MCP          (NASA POWER, no key)
        • Grid & Tariff MCP  (custom DISCOM rules + stress signal)
        • Benchmark MCP      (OSM Overpass — nearby peer facilities)
   → Digital twin simulator (baseline vs staggered vs solar-assisted)
   → Multi-agent decision core:
        Forecast agent → Anomaly agent → Optimizer agent (MILP, solver-grounded)
        → Explainer & audit agent (cites the rule behind each call)
        → Human approval gate
   → Auto action executor (writes to BMS/API where one exists)
     + Facility chat copilot ("why", "what-if")
```

## Tech stack (locked)

| Layer | Choice |
|---|---|
| Frontend | Next.js + TypeScript |
| 3D digital twin | Three.js via react-three-fiber |
| Backend | FastAPI (Python) |
| Agent orchestration | LangGraph or CrewAI |
| LLM — explainer/reasoning | Gemini API, Google AI Studio free tier |
| LLM — fast/frequent calls | Groq free tier (Llama 3.3 70B) |
| Weather | Open-Meteo, no key |
| Solar/irradiance | NASA POWER, no key |
| Geocoding | OSM Nominatim, no key |
| Peer benchmark | OSM Overpass, no key |
| Time-series analytics | DuckDB, embedded |
| Auth/app state | Supabase free tier |
| Hosting | Hugging Face Spaces / Vercel |

**Units, non-negotiable:** IST throughout (convert at the edges only), ₹ for currency, kWh/kW for energy/power.

## The 5 shared contracts — never invent a parallel structure, extend these

**Entity model:** `facility → zone → equipment → meter_reading`. IDs are human-scannable strings (`z_hvac_3`, not raw UUIDs).

**WebSocket event:**
```json
{
  "event": "reading" | "alert" | "recommendation" | "approval_update",
  "facility_id": "f_001",
  "zone_id": "z_hvac_3",
  "timestamp": "2026-08-14T06:00:00+05:30",
  "payload": { }
}
```

**Recommendation object** (as of today, includes fixes from the data analyst's review — confirm current shape in `packages/contracts` before hardcoding):
```json
{
  "id": "rec_042",
  "type": "sequence" | "shift" | "solar_advisory" | "composite",
  "target": ["z_hvac_3", "z_compressor_1"],
  "estimated_savings_inr": 130000,
  "spike_risk_reduction_pct": 38,
  "reasoning": "Chiller #2 ramp and Compressor #1 restart coincide at 06:00, pushing demand to 680kW against a 500kW contracted limit",
  "cited_rule": "demand_charge_15min_peak",
  "confidence": 0.94,
  "requires_approval": true,
  "status": "proposed" | "approved" | "rejected" | "executed"
}
```

**MCP tool envelope:**
```json
{
  "source": "open-meteo",
  "timestamp": "2026-08-14T06:00:00+05:30",
  "location": { "lat": 12.97, "lon": 77.59 },
  "payload": { },
  "confidence": 0.9
}
```

**Seed dataset:** frozen synthetic fixture at `packages/contracts/seed/seed_facility_data.json` — real Kaggle grid data (PJM) rescaled to campus kW, real Open-Meteo/NASA POWER weather and solar, with equipment state-machine spike injection layered on top (not pure spline interpolation, which can't produce real coincidence spikes). Everyone demos against this, not live API calls, so the demo doesn't depend on five free-tier APIs behaving simultaneously on stage.

## The canonical demo scenario — use these numbers if generating any example, test, or pitch content

At 05:45 AM, a heatwave forecast (38°C by 2PM) coincides with HVAC Chiller #2 and Air Compressor #1 both auto-restarting at 06:00 AM. Combined 15-minute demand hits 680kW against a 500kW contracted limit. The optimizer recommends: pre-cool Zone HVAC-3 by 1.5°C between 05:00-05:45 using off-peak power, delay Compressor #1 to 06:20, soft-ramp Chiller #2. Result: peak drops to 420kW (260kW shaved), avoiding a ₹1,30,000 monthly demand penalty, cited rule `demand_charge_15min_peak`, 94% confidence.

## Team — 8 people, all building in parallel today

| # | Role | Owns |
|---|---|---|
| 1 | MCP + backend spine | Context MCPs (weather/solar/tariff/benchmark), FastAPI skeleton |
| 2 | Data analyst | Forecasting, anomaly detection, MILP optimizer, seed dataset, ROI calc |
| 3 | API/backend integration | REST + WebSocket endpoints wiring everything to the contracts |
| 4 | 3D digital twin | Three.js visualization, spike-event replay |
| 5 | Dashboard/onboarding | KPI dashboard, approval-gate UI, sign-up flow |
| 6 | Deployment | GitHub org, hosting, secrets |
| 7 | AI integration | LangGraph/CrewAI orchestration, chat copilot |
| 8 | QA/integration/demo | Slack, cross-checking, AI_USAGE.md, pitch deck, rehearsal |

When starting a session, tell Claude which of these 8 you're working on — everything above is shared ground truth, but your task is only your row.

## Repo structure

```
/apps
  /api        ← FastAPI backend
  /web        ← Next.js frontend + dashboard
  /twin       ← Three.js digital twin
/packages
  /contracts  ← shared types: Pydantic models (source of truth) + mirrored TS interfaces
```
