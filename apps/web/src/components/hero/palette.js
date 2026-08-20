// OptiGrid color system
// Primary: electric violet/purple
// Secondary live-state: muted cyan/teal (retained from original scene)
// Theme: purple + black + very dark graphite — enterprise, not cyberpunk
export const COLORS = {
  // Backgrounds
  bg: "#07070f",
  bgGraphite: "#0c0c18",
  fog: "#07070f",

  // Metal / concrete — lightened from the original near-black values so
  // geometry actually reads under lighting instead of staying a silhouette.
  metalDark: "#242838",
  metalMid: "#383e56",
  metalLight: "#565d80",
  metalWarm: "#332e42",
  concrete: "#2a2c38",
  concreteLight: "#383c4c",
  glass: "#16192a",
  windowLit: "#6fd8ff",

  // OptiGrid purple accent — primary brand
  purple: "#8b5cf6",           // electric violet
  purpleDim: "#5b21b6",        // dim / depth
  purpleGlow: "#a78bfa",       // hover / emphasis
  purpleFaint: "rgba(139,92,246,0.18)", // subtle fills
  purpleTrace: "rgba(139,92,246,0.32)", // lines / borders

  // Live-state accent (retained scene cyan for energy nodes)
  energyCyan: "#3fe9d6",
  energyCyanDim: "#1c7d75",
  teal: "#2dd4bf",

  // Risk states
  warnAmber: "#f59e0b",
  warnRed: "#ef4444",

  // Text
  white: "#f0edff",
  textMuted: "rgba(240,237,255,0.55)",
  textDim: "rgba(240,237,255,0.35)",
};

// Story-phase palette (energy network reacts to these)
export const STORY_COLOR = {
  normal: COLORS.energyCyan,
  peak: COLORS.warnRed,
  transition: COLORS.warnAmber,
  optimized: COLORS.energyCyan,
};
