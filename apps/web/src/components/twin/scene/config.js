// Zone/equipment layout is a presentation choice; the values driving each
// zone's visuals come from spike-data.json (base_kw / hvac_kw / comp_kw),
// which is real seed_facility_data.json data pulled in by App.

// CONTRACT_LIMIT_KW moved to packages/shared/twin-data/ — it's used by both
// this app (Digital Twin) and apps/hero (marketing hero's story sequence).
// Re-exported here unchanged so every existing import of it from this file
// keeps working without modification.
export { CONTRACT_LIMIT_KW } from "../../../data/contractLimit.js";

// Facility floor plan (all presentation-only, world-space coordinates):
//
//              GRID
//               |
//        ELECTRICAL ROOM
//               |
//   ,---------- MAIN FACILITY ----------,
//   |            BASELOAD HALL          |
//   |-------------------|----------------|
//   |   HVAC PLANT ROOM | COMPRESSOR ROOM|
//   '-------------------'----------------'
//
// Kept as one coherent campus (not three floating objects) — every room
// boundary below is consumed by scene/Architecture.jsx to build matching
// transparent walls/floor plan, and by scene/Floor.jsx for the connecting
// service corridor.
export const POWER_NODE_POSITION = [0, 0, -10.5];
export const ELECTRICAL_ROOM_POSITION = [0, 0, -7];
export const ELECTRICAL_ROOM_SIZE = [4.6, 3.0]; // [width, depth]

// Main facility envelope + internal room split (shared by Architecture.jsx).
export const FACILITY_BOUNDS = { minX: -6.4, maxX: 6.4, minZ: -3.0, maxZ: 6.6 };
export const BACK_HALL_SPLIT_Z = 1.3; // baseload hall <-> front rooms
export const FRONT_ROOM_SPLIT_X = 0; // HVAC room <-> compressor room

export const MAIN_FACILITY_POSITION = [0, 0, 1.5];

// Accent colors are a presentation choice (see note above) — purple/cyan
// only, representing STATE/ENERGY rather than equipment identity. Equipment
// housings themselves are graphite/metal regardless of zone; these accents
// drive pad rings, energy-flow default color, and LED/gauge glow.
export const ZONES = [
  {
    id: "z_baseload_1",
    label: "Baseload Systems",
    dataKey: "base_kw",
    kind: "baseload",
    position: [0, 0, -1.1],
    color: "#8B5CF6",
  },
  {
    id: "z_hvac_3",
    label: "HVAC Zone 3",
    dataKey: "hvac_kw",
    kind: "hvac",
    position: [-3.2, 0, 4.2],
    color: "#67E8F9",
  },
  {
    id: "z_compressor_1",
    label: "Compressor 1",
    dataKey: "comp_kw",
    kind: "compressor",
    position: [3.2, 0, 4.2],
    color: "#67E8F9",
  },
];

// rec_042.json targets these two zones for the spike mitigation.
export const REC_042_TARGET_ZONES = ["z_hvac_3", "z_compressor_1"];
