# OptiGrid Hero

## Purpose

The OptiGrid marketing / landing experience. Standalone application —
independently deployable, with its own `package.json`/`vite.config.js` —
distinct from the operational Digital Twin, which lives in the sibling app
`apps/twin/`.

## Entry point

```
src/HeroPage.jsx
```

Mounted by `src/App.jsx`, which also owns this app's own internal routing:

```jsx
<Route path="/" element={<HeroPage />} />
<Route path="/facilities" element={<FacilitiesPlaceholder />} />
```

The Digital Twin is **not** a route of this app — it's a separate
deployable (`apps/twin`). The hero's "Explore Your Facility" CTA currently
navigates to `/facilities` (a placeholder page in this app); wiring it to
the real Twin deployment is the integration step left for later.

## Running it

```
cd apps/hero
npm install
npm run dev
```

## Structure

```
apps/hero/
  index.html
  package.json
  vite.config.js
  public/assets/          — scaffold for future GLB model replacements
                             (facility/hvac/compressor/electrical/environment)
  src/
    main.jsx
    App.jsx                — router: "/" and "/facilities"
    HeroPage.jsx            — entry point, see above
    HeroOverlay.jsx         — nav, headline, CTAs, metrics strip
    CameraRig.jsx           — cinematic camera drift/parallax/fly-to
    palette.js              — OptiGrid purple/black color system
    story.js                — hero story cycle (normal/peak/optimized)
    FacilitiesPlaceholder.jsx
    scene/                  — hero's own procedural 3D campus (chillers,
                               cooling tower, transformer, etc.) — distinct
                               from apps/twin/src/scene/, no overlap
    components/             — DemoModal, SignInModal, HowItWorksModal
    sections/                — Platform/Solutions/Resources/About/Pricing/
                               FinalCTA (currently unmounted — see
                               HeroPage.jsx if re-enabling the full scroll page)
```

## Data

`src/story.js` imports real baseline/optimized peak and contract-limit
values from `packages/shared/twin-data/` (shared with `apps/twin` — see
that app's README for the full explanation). This app does not keep its own
copy of that data.

## Real data shown in the hero story

- Baseline peak: **777.71 kW**
- Optimized peak: **397.71 kW**
- Contract limit: **500 kW**

Same real, already-verified figures the Digital Twin uses — nothing here is
invented.
