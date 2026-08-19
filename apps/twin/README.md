# OptiGrid Digital Twin

## Purpose

Operational 3D facility digital twin. This is a standalone application —
independently deployable, with its own `package.json`/`vite.config.js` —
distinct from the OptiGrid marketing hero, which now lives in the sibling
app `apps/hero/`. This app monitors real facility telemetry, visualizes a
demand-spike event, and walks through the approval flow for `rec_042`, a
real MILP-generated optimization recommendation.

## Entry point

```
src/DigitalTwinPage.jsx
```

The single top-level component (mounted by `src/App.jsx`):

```jsx
import DigitalTwinPage from "./DigitalTwinPage.jsx";

<DigitalTwinPage />
```

It is fully self-contained: a `<div>` with a fixed, full-viewport layout
hosting an `@react-three/fiber` `<Canvas>` plus its own HUD overlay. It takes
no props and needs no parent-provided context.

## Running it

```
cd apps/twin
npm install
npm run dev
```

This app has no router — it renders `DigitalTwinPage` directly. If it's
mounted inside a larger application that owns routing (e.g. at a `/twin`
path), wrap it there; this app itself doesn't assume a particular URL.

## Structure

```
apps/twin/
  index.html
  package.json
  vite.config.js
  src/
    main.jsx
    App.jsx                    — renders <DigitalTwinPage />
    DigitalTwinPage.jsx         — entry point, see above
    scene/
      Floor.jsx, PowerNode.jsx, EquipmentZone.jsx, EquipmentRig.jsx,
      EnergyFlow.jsx            — twin-exclusive 3D scene
      config.js                 — zone layout + re-exports CONTRACT_LIMIT_KW
                                   (see "Data" below)
    hud/
      Hud.jsx, TimeSlider.jsx, ModePanel.jsx, ComparisonPanel.jsx,
      RecommendationPanel.jsx   — twin-exclusive HUD
    data/
      optimization.js           — thin re-export shim, see "Data" below
```

## Data

- `src/data/optimization.js` in this app is a **re-export shim** —
  `export * from "../../../../packages/shared/twin-data/optimization.js"`.
  The real file lives at **`packages/shared/twin-data/optimization.js`**,
  alongside **`packages/shared/twin-data/spike-data.json`** (the real
  telemetry timeline) and **`packages/shared/twin-data/contractLimit.js`**
  (the 500 kW contract limit). These are genuinely shared with `apps/hero`,
  which imports the same peak/timeline/contract-limit values for its own
  story sequence — kept in one place so there's a single source of truth,
  not two copies that could drift apart.
- `src/scene/config.js` similarly re-exports `CONTRACT_LIMIT_KW` from that
  shared location; its other exports (`POWER_NODE_POSITION`, `ZONES`,
  `REC_042_TARGET_ZONES`) are twin-exclusive 3D layout, not real data.

The optimized peak (397.71 kW) is the verified output of
`Model/MILP_optimizer.py`, not the unreconciled `420.0` figure in the raw
`packages/contracts/seed/rec_042.json` — see the comments in
`packages/shared/twin-data/optimization.js` for the full trace.

## Main components

- `scene/EquipmentZone.jsx` + `scene/EquipmentRig.jsx` — the three equipment
  zones (Baseload Systems, HVAC Zone 3, Compressor 1), each rendering its
  real kW value, spike halo, ghost-comparison overlay, and status badge.
- `scene/EnergyFlow.jsx` — animated particles along the grid → equipment
  conduits, reacting to load ratio and spike state.
- `scene/PowerNode.jsx` — the grid source node.
- `scene/Floor.jsx` — the ground plane / grid.
- `hud/Hud.jsx` — current load, contract limit, peak risk readout.
- `hud/TimeSlider.jsx` — scrubs the real 8-point telemetry timeline.
- `hud/ModePanel.jsx` — Baseline / Optimized scenario toggle + "Simulate
  Recommendation" playback.
- `hud/ComparisonPanel.jsx` — baseline vs. optimized peak comparison.
- `hud/RecommendationPanel.jsx` — `rec_042` details plus the
  Approve/Reject workflow (local UI state only — no backend call).

## Real data

- Baseline peak: **777.71 kW**
- Optimized peak: **397.71 kW**
- Contract limit: **500 kW**
- Recommendation: **rec_042** (₹130,000 estimated savings, 94% confidence,
  `demand_charge_15min_peak` rule)

None of these are placeholders — they trace back to
`packages/contracts/seed/seed_facility_data.json`,
`packages/contracts/seed/rec_042.json`, and `Model/MILP_optimizer.py`.

## Integrating this app into the main OptiGrid application

Two supported paths:

1. **As a standalone deployable** (current state): `apps/twin` builds and
   runs entirely on its own (`npm install && npm run dev` inside this
   folder). Point whatever routes to it externally (e.g. a reverse proxy or
   an `<iframe>`/micro-frontend boundary at `/twin`).
2. **As an embedded module**: import `src/DigitalTwinPage.jsx` into another
   React app and mount it wherever that app's `/twin` route is defined. If
   doing this, also carry over `packages/shared/twin-data/` (see "Data"
   above) — that's the only thing this app depends on outside its own
   folder.
