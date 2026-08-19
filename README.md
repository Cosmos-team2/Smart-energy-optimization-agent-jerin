# Smart Energy Consumption Optimization Agent ⚡🤖

[![Organization](https://img.shields.io/badge/Organization-Cosmos--team2-blue.svg)](https://github.com/Cosmos-team2)
[![Hackathon](https://img.shields.io/badge/Hackathon-Cognizant--2026-orange.svg)]()
[![Python](https://img.shields.io/badge/Python-3.11%2B-brightgreen.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Verification Suite](https://img.shields.io/badge/Verification-100%25%20PASSED-success.svg)]()

> **Hackathon Problem Statement #10**: An autonomous, LLM-orchestrated energy management agent built for commercial campuses and industrial facilities in India that operate **without existing Building Management Systems (BMS)**.

---

## 📌 Executive Summary & Core Value Proposition

Most commercial energy management solutions (e.g. BrainBox AI, Schneider EcoStruxure) assume the customer already has expensive building automation infrastructure installed. Our target customer does not.

Our agent fills three critical industry gaps:
1. **No-BMS Onboarding**: Operates purely from smart-meter exports, utility bills, and facility addresses without requiring hardware retrofits.
2. **India DISCOM Tariff Optimization**: Encodes 15-minute maximum demand charge billing logic (where a single uncoordinated simultaneous equipment startup sets the fixed demand charge for the *entire month*). Avoids ₹3–12 Lakhs/year in avoidable peak penalties.
3. **Agentic Reasoning with Citation**: Rather than raw alert dashboards, an LLM-orchestrated decision engine recommends solver-grounded actions (MILP/staggered load schedules) and explicitly cites the rule or threshold triggered.

> 💡 **Root Cause Insight**: Peak energy costs are a timing problem, not a total volume problem. Demand charges are driven by simultaneous equipment startup (HVAC, compressor restarts, motor inrush) clustering in one 15-minute window. Our optimizer's core function is load staggering.

---

## 🏗️ System Architecture

```text
Facility Sign-up (Address & Smart Meter CSV)
   │
   ├──> Geocoding & Context MCPs (Parallel Fan-out)
   │     ├── Weather Context MCP   (Open-Meteo API)
   │     ├── Solar Context MCP     (NASA POWER API)
   │     ├── Grid & Tariff MCP     (DISCOM 15-min Peak Rules)
   │     └── Peer Benchmark MCP    (OSM Overpass API)
   │
   ├──> Digital Twin Simulator (Monte Carlo: Baseline vs Staggered vs Solar)
   │
   └──> Multi-Agent Decision Core
         ├── 🔮 Forecast Agent     (Predicts baseline load curve)
         ├── ⚠️ Anomaly Agent      (Detects abnormal load spikes)
         ├── ⚡ Optimizer Agent    (MILP solver-grounded load staggering)
         ├── 📝 Explainer Agent    (Cites exact tariff rule & rule threshold)
         └── 🛡️ Human Gatekeeper   (Approval workflow for automated actions)
```

---

## 📁 Repository Directory Structure

```text
smart-energy-optimization-agent/
├── README.md                                      # Project overview, architecture & setup guide
├── HANDOVER_1.md                                  # Comprehensive team handover & architecture contract doc
├── Smart_Energy_Optimization_Agent_Data_Analyst_Roadmap.pdf # Data Analyst & Strategy Roadmap
├── historical_training_campus_data.csv            # Final Master Historical Campus Dataset
├── audit_dataset_quality.py                       # Master dataset quality audit script
├── build_real_master_dataset.py                  # Master dataset build & pipeline script
├── generate_pdf.py                                # Executive PDF report generator script
├── verify_all_checks.py                           # End-to-end verification & sanity suite
├── Marking_scheme_expectation/                    # Hackathon evaluation criteria & benchmark guidelines
│   ├── 1.jpeg ... 12.jpeg
└── packages/                                      # Monorepo packages
    └── contracts/                                 # Shared Pydantic data models & seed fixtures
        ├── models.py                              # Core Pydantic contracts (Source of Truth)
        └── seed/
            ├── rec_042.json                       # Recommendation contract seed fixture
            └── seed_facility_data.json            # Facility seed dataset
```

---

## ⚡ Tech Stack & Tools

| Layer | Technology / Choice | Purpose & Rationale |
|---|---|---|
| **Backend Spine** | Python 3.11+ / FastAPI | High performance, async, auto-generated OpenAPI / Swagger docs |
| **Data Contracts** | Pydantic v2 | Strict typing and serialization for inter-agent payload contracts |
| **Time-Series Engine** | Pandas / DuckDB | High-speed hourly load analysis, spike calculation, & feature engineering |
| **Agent Core** | LangGraph / CrewAI | Multi-agent orchestration and tool calling workflow |
| **LLM Reasoning** | Gemini API & Groq | Free tier high-throughput reasoning and sub-100ms agent calls |
| **Digital Twin UI** | Next.js / Three.js (r3f) | Interactive 3D campus parametric load rendering |

---

## 📋 Data Contracts & Schemas

All components build against 5 locked data contracts located in [`packages/contracts/models.py`](packages/contracts/models.py):

1. **Entity Model**: `facility -> zone -> equipment -> meter_reading` (human-scannable string IDs, e.g. `z_hvac_3`).
2. **WebSocket Event Schema**: Real-time event transport envelope for readings, alerts, and recommendations.
3. **Recommendation Object (`rec_042.json`)**:
   ```json
   {
     "id": "rec_042",
     "type": "composite",
     "target": ["z_hvac_3", "z_compressor_1"],
     "estimated_savings_inr": 130000.0,
     "spike_risk_reduction_pct": 62.5,
     "baseline_peak_kw": 777.71,
     "optimized_peak_kw": 420.0,
     "reasoning": "Simultaneous restart of Chiller #2 (+180 kW) and Compressor #1 (+140 kW) creates a 777.71 kW demand spike between 06:00-06:15 AM, exceeding the 500 kW contract limit. Staggering compressor restart and pre-cooling Zone HVAC-3 reduces peak load to 420.0 kW.",
     "cited_rule": "demand_charge_15min_peak",
     "confidence": 0.94,
     "requires_approval": true,
     "status": "proposed"
   }
   ```
4. **MCP Tool Envelope**: Standardized response wrapper for weather, solar, tariff, and benchmark context tools.
5. **Seed Datasets**: Synthetic frozen fixtures stored in [`packages/contracts/seed/`](packages/contracts/seed/).

---

## 🚀 Quick Start & Running Scripts

### 1. Prerequisites
Ensure you have Python 3.11+ installed.
```bash
python --version
```

### 2. Environment Setup
Create and activate a virtual environment:
```bash
# Windows (PowerShell)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Linux / macOS
python3 -m venv .venv
source .venv/bin/activate
```

Install dependencies:
```bash
pip install pandas pydantic fpdf2 reportlab
```

### 3. Run Dataset Quality Audit
To audit the master campus dataset (`historical_training_campus_data.csv`):
```bash
python audit_dataset_quality.py
```

### 4. Run Executive PDF Report Generator
To compile the official PDF report:
```bash
python generate_pdf.py
```

### 5. Run Full Teammate Verification Suite
Run the end-to-end verification suite validating data jumps, seed JSONs, and Pydantic contract integrity:
```bash
python verify_all_checks.py
```

---

## 📊 Track & Team Ownership

| Track # | Feature Track | Contract Reference | Ownership / Responsibilities |
|:---:|---|---|---|
| **1** | Forecasting & Anomaly Engine | Contract §5.1 & §5.5 | Baseline demand curve prediction & spike detection |
| **2** | Tariff & Optimization Engine | Track 1 output | MILP solver-grounded load staggering & tariff rules |
| **3** | Context / MCP Integration Layer | Contract §5.4 | Open-Meteo, NASA POWER, DISCOM, & Overpass tools |
| **4** | Agent Orchestration & Copilot | Tracks 1–3 tools | LangGraph orchestration, tool execution & chat copilot |
| **5** | Dashboard & Analytics UI | Contract §5.2 | Next.js frontend & real-time telemetry metrics |
| **6** | Onboarding & Seed Fixtures | Contract §5.5 | Seed dataset owner & facility setup |
| **7** | Reporting, ROI & Audit Replay | Contract §5.3 | Savings calculation & audit trail verification |

---

## 👥 Organization & Repository Info

- **GitHub Organization**: [`Cosmos-team2`](https://github.com/Cosmos-team2)
- **Repository**: [`smart-energy-optimization-agent`](https://github.com/Cosmos-team2/smart-energy-optimization-agent)
- **Lead Maintainer**: `@Jerinarch`
- **License**: MIT
