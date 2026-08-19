import spikeData from "./spike-data.json";

const { timeline, recommendation } = spikeData;

export const BASELINE_TIMELINE = timeline;
export const RECOMMENDATION = recommendation;

export const SPIKE_INDEX = timeline.findIndex((t) => t.is_spike_event === 1);

// ---------------------------------------------------------------------------
// OPTIMIZED PEAK — TRACED, NOT TAKEN AT FACE VALUE
//
// packages/contracts/seed/rec_042.json has an "optimized_peak_kw": 420.0
// field, but that number does not trace back to anything computed anywhere
// in this repo. The only executable code that actually computes an
// optimized peak is Model/MILP_optimizer.py (a scipy.linprog MILP over the
// same baseline_peak_kw=777.71 and the same action bounds rec_042 cites).
// Running it reproduces Model/sample_inference_rec_042.json exactly:
//
//     python Model/MILP_optimizer.py
//     -> Total Peak Load Shaved: 380.00 kW
//     -> Optimized Peak Demand:   397.71 kW
//
// 420.0 only ever appears inside a hand-written reasoning sentence (present
// verbatim, and un-reconciled, in BOTH rec_042.json and the MILP script's
// own output) — never as the result of a calculation. So 420.0 is dropped;
// 397.71 kW is used instead, since it's the one figure in the repo that's
// actually backed by running code against the real baseline reading.
//
// baseline_peak_kw (777.71) is unaffected by any of this — it matches the
// real seed_facility_data.json reading at 2017-01-02T06:00 exactly, in
// both rec_042.json and the MILP script.
// ---------------------------------------------------------------------------
export const BASELINE_PEAK_KW = recommendation.baseline_peak_kw; // 777.71 — real telemetry
export const OPTIMIZED_PEAK_KW = 397.71; // MILP_optimizer.py output, verified by running it

// ---------------------------------------------------------------------------
// PER-ZONE BREAKDOWN for the 3D view
//
// MILP_optimizer.py's three decision variables, at their solved optimum
// (each pinned to its own upper bound, since the LP only has a lower-bound
// constraint on their sum):
//   x0 = 140 kW  — HVAC pre-cool reduction (bounds 10-140), zone z_hvac_3
//   x1 = 140 kW  — compressor delay reduction (bounds 50-140), zone z_compressor_1
//   x2 = 100 kW  — chiller soft-ramp reduction (bounds 20-100), zone z_hvac_3
//                  (chiller capacity is part of the HVAC zone's real hvac_kw)
// Sum = 380 kW, matching "Total Peak Load Shaved" above.
//
// Applying these reductions to the REAL baseline component readings at the
// spike (base_kw=91.54, hvac_kw=385.97, comp_kw=300.2):
//   base_kw  -> 91.54            (untouched: z_baseload_1 isn't a rec_042 target)
//   hvac_kw  -> 385.97 - (x0+x2) = 385.97 - 240 = 145.97
//   comp_kw  -> 300.2  - x1      = 300.2  - 140 = 160.2
// Sum = 397.71, reconciling exactly with OPTIMIZED_PEAK_KW above.
// ---------------------------------------------------------------------------
const spikeFrame = timeline[SPIKE_INDEX];

const MILP_HVAC_PRECOOL_REDUCTION_KW = 140; // x0
const MILP_COMPRESSOR_DELAY_REDUCTION_KW = 140; // x1
const MILP_CHILLER_SOFTRAMP_REDUCTION_KW = 100; // x2

const optimizedBaseKw = spikeFrame.base_kw;
const optimizedHvacKw = spikeFrame.hvac_kw - (MILP_HVAC_PRECOOL_REDUCTION_KW + MILP_CHILLER_SOFTRAMP_REDUCTION_KW);
const optimizedCompKw = spikeFrame.comp_kw - MILP_COMPRESSOR_DELAY_REDUCTION_KW;

export const OPTIMIZED_SPIKE_FRAME = {
  ...spikeFrame,
  total_kw: OPTIMIZED_PEAK_KW,
  base_kw: optimizedBaseKw,
  hvac_kw: optimizedHvacKw,
  comp_kw: optimizedCompKw,
  is_spike_event: 0,
};

// Optimized timeline: identical to the real baseline timeline at every
// timestamp except the spike slot, which is replaced by the frame above.
// Everything outside that one slot is the same real seed_facility_data.json
// reading used in baseline mode.
export const OPTIMIZED_TIMELINE = timeline.map((frame, i) =>
  i === SPIKE_INDEX ? OPTIMIZED_SPIKE_FRAME : frame
);

export const OPTIMIZATION_EXPLANATION =
  "Optimized peak is 397.71 kW, from running Model/MILP_optimizer.py (verified by executing it — " +
  "output matches the committed Model/sample_inference_rec_042.json exactly). This replaces the " +
  "rec_042.json seed's 420.0 kW field, which does not trace back to any computation in the repo. " +
  "The HVAC/Compressor split shown in the 3D view applies the MILP's own solved decision variables " +
  "(x0=140 kW HVAC pre-cool, x1=140 kW compressor delay, x2=100 kW chiller soft-ramp) to the real " +
  "baseline component readings: base_kw stays at 91.54 kW (untouched), hvac_kw = 385.97-(140+100) = " +
  "145.97 kW, comp_kw = 300.2-140 = 160.2 kW; sum = 397.71 kW exactly.";
