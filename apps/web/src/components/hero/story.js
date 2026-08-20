// Hero story cycle: NORMAL -> PEAK RISK -> transition -> OPTIMIZED -> loop.
// All kW figures come from the same real, already-verified sources the
// operational Digital Twin (apps/twin) uses — nothing here is invented.
// This app and apps/twin both import from packages/shared/twin-data/
// rather than each keeping their own copy of the real telemetry/derivation.
import {
  BASELINE_PEAK_KW,
  BASELINE_TIMELINE,
  OPTIMIZED_PEAK_KW,
  OPTIMIZED_TIMELINE,
  SPIKE_INDEX,
} from "../../data/optimization.js";
import { CONTRACT_LIMIT_KW } from "../../data/contractLimit.js";

export { BASELINE_PEAK_KW, OPTIMIZED_PEAK_KW, CONTRACT_LIMIT_KW };

// Real per-equipment kW readings for the tooltip content, at each story
// phase. normal/transition reuse real non-spike/optimized frames already
// present in the timeline — nothing invented.
export function frameForPhase(phase) {
  if (phase === "peak") return BASELINE_TIMELINE[SPIKE_INDEX];
  if (phase === "transition" || phase === "optimized") return OPTIMIZED_TIMELINE[SPIKE_INDEX];
  return BASELINE_TIMELINE[0];
}

export const STORY_STEPS = [
  { phase: "normal", holdMs: 4200 },
  { phase: "peak", holdMs: 3400 },
  { phase: "transition", holdMs: 1800 },
  { phase: "optimized", holdMs: 4200 },
];

export function badgeForPhase(phase) {
  if (phase === "peak") {
    return {
      title: "PEAK RISK",
      value: `${BASELINE_PEAK_KW.toFixed(1)} kW`,
      sub: `LIMIT ${CONTRACT_LIMIT_KW.toFixed(0)} kW`,
      tone: "danger",
    };
  }
  if (phase === "optimized") {
    return {
      title: "OPTIMIZED",
      value: `${OPTIMIZED_PEAK_KW.toFixed(1)} kW`,
      sub: "WITHIN LIMIT",
      tone: "good",
    };
  }
  return null;
}
