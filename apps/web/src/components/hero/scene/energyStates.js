import { COLORS } from "../palette.js";

// Shared vocabulary between EnergyNetwork (conduit particles) and
// FacilityScene (equipment glow/tint) so a channel that's "hot" pulses the
// same color everywhere at once.
export const STATE_STYLE = {
  calm: { color: COLORS.energyCyan, speed: 0.5, count: 3, size: 0.06, glow: 0.3 },
  busy: { color: COLORS.energyCyan, speed: 0.85, count: 4, size: 0.07, glow: 0.4 },
  warm: { color: COLORS.warnAmber, speed: 0.95, count: 5, size: 0.075, glow: 0.55 },
  hot: { color: COLORS.warnRed, speed: 1.9, count: 8, size: 0.09, glow: 0.85 },
  idle: { color: "#465059", speed: 0.12, count: 1, size: 0.045, glow: 0.12 },
};

export const CHANNEL_STATE = {
  normal: { trunk: "calm", hvac: "calm", compressor: "calm" },
  peak: { trunk: "busy", hvac: "hot", compressor: "hot" },
  transition: { trunk: "busy", hvac: "warm", compressor: "idle" },
  optimized: { trunk: "calm", hvac: "calm", compressor: "calm" },
};

export function channelsForPhase(phase) {
  return CHANNEL_STATE[phase] ?? CHANNEL_STATE.normal;
}
