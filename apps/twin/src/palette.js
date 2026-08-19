// OptiGrid color system for the Digital Twin — matches apps/hero/src/palette.js
// (kept as an independent copy, not a shared import, so this app stays
// self-contained). Equipment materials are graphite/metal; color is reserved
// for STATE and ENERGY (purple/cyan normal, amber warning, red critical),
// never for equipment identity.
export const COLORS = {
  // Backgrounds — deliberately brighter than a pure-black scene so geometry
  // reads immediately without zooming in.
  bg: "#0D0B16",
  bgMid: "#151220",
  bgGraphite: "#181425",
  fog: "#12101c",

  // Floor / architecture / metal — dark graphite + brushed metal, lightened
  // enough that geometry reads clearly under lighting instead of silhouetting.
  floor: "#171429",
  architecture: "#2c2740",
  metalDark: "#2c2f42",
  metalMid: "#353040",
  metalLight: "#615a78",
  metalWarm: "#3a3348",
  concrete: "#2a2c38",
  concreteLight: "#3a3648",
  graphite: "#221f30",
  glass: "#1e2036",
  windowLit: "#8fd9ff",

  // OptiGrid purple — primary brand / steady-state accent
  purple: "#8B5CF6",
  purpleDim: "#5b21b6",
  purpleGlow: "#A78BFA",
  purpleFaint: "rgba(139,92,246,0.18)",
  purpleTrace: "rgba(139,92,246,0.32)",

  // Live energy accent
  energyCyan: "#67E8F9",
  energyCyanDim: "#1c7d8a",

  // Risk states
  warnAmber: "#F59E0B",
  warnRed: "#EF4444",

  // Text
  white: "#EDE9FE",
  textMuted: "rgba(237,233,254,0.6)",
  textDim: "rgba(237,233,254,0.4)",
};

// Per-zone accent — subtle wayfinding tint only (pad rings / energy flow
// default color). Equipment housings stay graphite/metal regardless of zone;
// this never drives the primary visual language.
export const ZONE_ACCENT = {
  baseload: COLORS.purple,
  hvac: COLORS.energyCyan,
  compressor: COLORS.energyCyan,
};

// State color: what the scene should actually communicate. Spike = critical,
// otherwise a gentle purple/cyan "healthy/active" glow.
export function stateColor(spike, active) {
  if (spike) return COLORS.warnRed;
  if (active) return COLORS.energyCyan;
  return COLORS.purpleGlow;
}

// Wall/roof translucency per FACILITY VIEW mode (Architecture.jsx).
export const VIEW_MODE_OPACITY = {
  exterior: { wall: 0.4, roof: 0.92 },
  cutaway: { wall: 0.16, roof: 0.28 },
  floorplan: { wall: 0.06, roof: 0.04 },
};
