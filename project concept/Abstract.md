# Team Handover — [Project Name TBD]

**Why this doc exists:** I'm out for a day. This is everything you need to keep moving without me — the problem, the architecture, the 5 contracts nothing else should build without, the repo workflow, and what to do if you get stuck. Read this top to bottom once, then keep it open as a reference.

---

## 1. The problem, in one paragraph

Hackathon problem statement #10: build a **Smart Energy Consumption Optimization Agent** for buildings/campuses/factories that reduces cost without disrupting operations, forecasting peak consumption, detecting anomalies, and recommending energy-saving actions with estimated impact. The Kaggle dataset behind it (`robikscube/hourly-energy-consumption`) is grid-region-level (PJM Interconnection, US), not building-level — we use it to prove out the forecasting core, then simulate/augment for our real target: **Indian campuses and mid-size factories that have no BMS (building automation system) to plug into.**

## 2. Why this can actually win (the positioning, don't lose this)

Most competitors (BrainBox AI, Schneider EcoStruxure, Verdigris, Facilio) assume the customer already has expensive building automation infrastructure. Our customer doesn't. Three real gaps we're filling:

1. **No-BMS onboarding.** Works from smart-meter exports, bills, an address — no hardware retrofit.
2. **India-specific tariff logic.** DISCOM demand charges are billed on the highest 15-minute peak in the month — one uncoordinated startup can inflate the *entire month's* fixed charges. This is quantifiable, real money (₹3–12L/year avoidable for a mid-size facility), and no global competitor encodes it.
3. **Agentic, not dashboard.** An LLM-orchestrated agent that plans, calls tools, and *explains its reasoning with a citation back to the specific rule or threshold it triggered* — not just an alert feed.

**Root cause we're solving (say this to judges):** it's a timing problem, not a consumption problem. Demand charges are set by simultaneous equipment startup (HVAC, compressor restarts after defrost, motor inrush) clustering in one 15-minute window — not by total energy use. Our optimizer's job is to *stagger* loads, not just shift them to cheaper hours.

## 3. Architecture (text version of what's already been diagrammed)

```
Facility sign-up (just an address)
   → Geocode
   → fan out to context MCPs, in parallel:
        • Weather MCP        (Open-Meteo)
        • Solar MCP          (NASA POWER)
        • Grid & Tariff MCP  (custom DISCOM rules + stress signal)
        • Benchmark MCP      (OSM Overpass — nearby peer facilities)
   → Digital twin simulator (Monte Carlo: baseline vs staggered vs solar-assisted)
   → Multi-agent decision core:
        Forecast agent → Anomaly agent → Optimizer agent (MILP, solver-grounded)
        → Explainer & audit agent (cites the rule behind each call)
        → Human approval gate
   → Auto action executor (writes to BMS/API where one exists)
     + Facility chat copilot ("why", "what-if")
```

## 4. Tech stack (locked — don't change without flagging the group)

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Next.js + TypeScript** | UI/UX is a judged category; React ecosystem is fastest for polish |
| 3D digital twin | **Three.js via react-three-fiber**, inside the Next.js app | Stylized, not photorealistic — parametric blocks, animated load flow |
| Backend | **FastAPI (Python)** | Best ecosystem for the ML/optimizer/agent work; auto-generates OpenAPI docs |
| Agent orchestration | **LangGraph or CrewAI** (open source, self-hosted, free) | |
| LLM — reasoning/explainer | **Gemini API via Google AI Studio** (free tier, no card, 1,500 req/day) | Data may be used to improve Google's models on free tier — fine for a hackathon |
| LLM — fast/frequent agent calls | **Groq** (free tier, no card, 30 RPM / 14,400 req/day, sub-100ms) | Llama 3.3 70B / GPT-OSS 120B |
| Weather data | **Open-Meteo** — no key, ~10K req/day | |
| Solar/irradiance data | **NASA POWER** — no key, global coverage incl. India | |
| Geocoding | **OSM Nominatim** — free, ~1 req/sec fair use, needs a User-Agent header | |
| Peer benchmark | **OSM Overpass API** — free | |
| Time-series/analytics | **DuckDB** (embedded, no server) | |
| App state/auth | **Supabase** free tier (Postgres + auth) | |
| Hosting (demo) | **Hugging Face Spaces / Streamlit Community Cloud** or Vercel (frontend) | free, no card |

Units convention, don't deviate: **IST throughout** (convert at the edges only), **₹** for currency, **kWh** for energy.

## 5. The 5 contracts — these must exist before anyone else builds

If you only read one section while I'm out, read this one. These are the shapes every track reads or writes to. **Nobody should invent their own version of these** — if something's missing, add a field, don't create a parallel structure.

### 5.1 Entity model
`facility → zone → equipment → meter_reading`. IDs are strings, human-scannable (e.g. `z_hvac_3`, not a raw UUID) so debugging in the demo isn't painful.

### 5.2 WebSocket event schema
```json
{
  "event": "reading" | "alert" | "recommendation" | "approval_update",
  "facility_id": "f_001",
  "zone_id": "z_hvac_3",
  "timestamp": "2026-08-14T10:15:00+05:30",
  "payload": { }
}
```

### 5.3 Recommendation/decision object
```json
{
  "id": "rec_042",
  "type": "sequence" | "shift" | "solar_advisory",
  "target": ["z_hvac_3", "z_compressor_1"],
  "estimated_savings_inr": 4200,
  "spike_risk_reduction_pct": 63,
  "reasoning": "Compressor restart coincides with AHU startup at 06:00",
  "cited_rule": "demand_charge_15min_peak",
  "requires_approval": true,
  "status": "proposed" | "approved" | "rejected" | "executed"
}
```
This object is the backbone of the reporting/audit-trail track later — don't let it drift.

### 5.4 MCP tool envelope
Every context tool (weather, solar, tariff, benchmark) returns the same wrapper:
```json
{
  "source": "open-meteo",
  "timestamp": "2026-08-14T10:15:00+05:30",
  "location": { "lat": 12.97, "lon": 77.59 },
  "payload": { },
  "confidence": 0.9
}
```

### 5.5 Seed dataset & units
One frozen synthetic fixture: readings, weather, tariff schedule. Generated once, committed to the repo, used by **everyone** so demo day doesn't depend on five free-tier APIs behaving simultaneously in front of judges. Location: `packages/contracts/seed/`.

Also needed but can trail slightly: **auth/role model** (org → facility → user) and the **safety-constraint config** (equipment the optimizer is never allowed to touch, min/max duty cycles, maintenance windows) — get these sketched by day 2 even if not finalized.

## 6. Repo structure

Monorepo, single GitHub org.

```
/apps
  /api        ← FastAPI backend (mine)
  /web        ← Next.js frontend + dashboard
  /twin       ← Three.js digital twin (mine, may live inside /web)
/packages
  /contracts  ← shared types: Pydantic models (source of truth) + generated/mirrored TS interfaces
```

**Branch protection: require PR review on `packages/contracts` only.** Everything else stays open so people aren't blocked waiting on me.

## 7. Team & track ownership

I own the backend spine (`/apps/api`) and the 3D twin (`/apps/twin`) — these touch everything else, which is why they're combined under one person.

| # | Track | Depends on | Owner |
|---|---|---|---|
| 1 | Forecasting & anomaly engine | contracts (§5) | [Name] |
| 2 | Tariff & optimization engine | Track 1's output | [Name] |
| 3 | Context/MCP integration layer | contracts §5.4 | [Name] |
| 4 | Agent orchestration & copilot | Tracks 1–3 as tools | [Name] |
| 5 | Dashboard & analytics UI | contracts §5.2 | [Name] |
| 6 | Onboarding, auth, notifications, **seed dataset owner** | contracts §5.5 | [Name] |
| 7 | Reporting, ROI, audit-trail replay | contracts §5.3 | [Name] |

Whoever owns Track 6 — **you own the seed dataset**. Get it committed early; every other track's demo depends on it staying stable.

## 8. The 7-day plan

| Day | Focus |
|---|---|
| 1–2 | Skeleton: contracts, mock server, seed data (me) |
| 3 | Kickoff walkthrough of `/docs` (FastAPI auto-generated) + WebSocket test client. Everyone builds against mocks. |
| 4–5 | Real logic replaces mocks, track by track. Forecast + tariff engine go first — everything downstream needs their numbers. **Contracts freeze end of day 4** — no schema changes after this without a group conversation. |
| 6 | Integration day. No new features. Everyone's pieces get wired together. |
| 7 | Demo polish, script the walkthrough, rehearse. |

## 9. While I'm out — what to actually do

- [ ] Check `/docs` on the FastAPI app (Swagger UI) — that's the live source of truth, more current than this doc if there's ever a conflict.
- [ ] Everyone builds against the **mock server + fixture data** — don't wait for real backend logic to exist.
- [ ] If a contract (§5) seems wrong or missing a field: **add to it, don't fork it.** Open a PR against `packages/contracts`, tag it, I'll review when back.
- [ ] Track 6 owner: start the seed dataset now if it isn't committed yet — this unblocks everyone else the most.
- [ ] Track 1 & 2 owners: start with fake-but-plausible numbers against the seed data if real ML/optimizer logic isn't ready — Tracks 4, 5, 7 need *something* to build against today, not perfect numbers.
- [ ] Don't touch `/apps/twin` — I'll pick that back up directly when I'm back. If it's blocking your track, use a stub WebSocket event and move on.
- [ ] Questions → post in [team channel]. I'll catch up on everything when back, but don't sit blocked waiting for a reply — default to "add to the contract, keep building" per above.

## 10. Status as of handover

*[Fill in before sending: what's actually pushed to the repo right now — e.g. "contracts + mock server live, seed data 60% done, twin not started yet."]*
