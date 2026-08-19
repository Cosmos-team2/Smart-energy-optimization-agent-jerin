// Zone/equipment layout is a presentation choice; the values driving each
// zone's visuals come from spike-data.json (base_kw / hvac_kw / comp_kw),
// which is real seed_facility_data.json data pulled in by App.

// CONTRACT_LIMIT_KW moved to packages/shared/twin-data/ — it's used by both
// this app (Digital Twin) and apps/hero (marketing hero's story sequence).
// Re-exported here unchanged so every existing import of it from this file
// keeps working without modification.
export { CONTRACT_LIMIT_KW } from "../../../../packages/shared/twin-data/contractLimit.js";

export const POWER_NODE_POSITION = [0, 0, -6];

// All three zones sit on the same depth (z) so no zone's billboarded labels
// ever land behind/in front of another's from the default camera angle —
// they separate purely left-to-right.
export const ZONES = [
  {
    id: "z_baseload_1",
    label: "Baseload Systems",
    dataKey: "base_kw",
    kind: "baseload",
    position: [-6.2, 0, 3],
    color: "#5b8def",
  },
  {
    id: "z_hvac_3",
    label: "HVAC Zone 3",
    dataKey: "hvac_kw",
    kind: "hvac",
    position: [0, 0, 3],
    color: "#2fbf71",
  },
  {
    id: "z_compressor_1",
    label: "Compressor 1",
    dataKey: "comp_kw",
    kind: "compressor",
    position: [6.2, 0, 3],
    color: "#e08e2b",
  },
];

// rec_042.json targets these two zones for the spike mitigation.
export const REC_042_TARGET_ZONES = ["z_hvac_3", "z_compressor_1"];
