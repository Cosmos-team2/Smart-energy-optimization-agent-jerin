# Data Analyst / ML — Today's Handover

**Role:** Forecasting + anomaly detection + MILP optimizer + seed dataset (with spike injection) + ROI calculator.

You're already ahead — your `build_real_master_dataset.py` design (spline baseline + equipment state-machine spike overlay) is correct and stays as-is. Today is about **finishing and verifying it**, not redesigning it.

## Priority order for today

1. **Run the verification check against the actual generated file** — not just the design doc. A 15-min window around 06:00 must show a real >300kW jump (180 HVAC + 140 compressor). If it doesn't, the spike-injection code isn't actually wired up yet.
2. **Push `forecast_model.pkl`, `anomaly_model.pkl`, `seed_facility_data.json` to the repo** as early as possible — the API/backend track and both frontend tracks are blocked on this existing, even as a rough first pass.
3. **Add `confidence` and a `composite`/`sub_actions` structure** to the recommendation objects you're generating — these aren't in `packages/contracts` §5.3 yet. Flag in `#contracts` on Slack the moment you add them so the contracts owner can fold them into the shared schema.
4. **Retire the old rec_042 numbers everywhere you control** — replace ₹45,000/₹14,200 with the reconciled ₹1,30,000/month penalty avoided, 680kW→420kW peak shaved.
5. **Expose the ROI formula as one reusable function** — `kw_shaved × 500 × 12` — so the dashboard and reporting people can call it instead of reimplementing it.

## Contract touchpoints
- `packages/contracts` §5.1 (entity model) — your zone IDs must match `z_hvac_3`, `z_compressor_1`, `z_baseload_1` exactly.
- §5.3 (recommendation object) — this is the one you're extending. Coordinate before changing shape.

## Dependencies
- Nothing blocks you from starting — you own the data.
- API/backend track needs your output format (forecast array, recommendation object) as soon as you have a first real pass, even before it's polished.

## Definition of done for today
- [ ] Verification script passes against real generated data (not description)
- [ ] Seed dataset + both model files pushed
- [ ] `confidence` + composite type added and flagged to contracts owner
- [ ] Old rec_042 numbers replaced everywhere
- [ ] ROI function documented with a one-line usage example
