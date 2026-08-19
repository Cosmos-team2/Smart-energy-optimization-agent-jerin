// Shared campus footprint. Both the equipment placements (FacilityScene /
// sub-components) and the energy-network conduit paths read from this so
// pipes/energy lines always terminate exactly where the geometry is.
export const LAYOUT = {
  building: { position: [0, 0, 0], width: 11, height: 5.4, depth: 7.5 },
  roofY: 5.4,

  chillers: [
    [-3.4, 5.4, -1.6],
    [-1.2, 5.4, -1.6],
  ],
  coolingTower: [3.6, 5.4, -1.4],
  ahu: [0.2, 5.4, 2.2],
  solarArrayCenter: [-2.6, 5.4, 2.6],
  solarArraySize: [4.4, 2.6],

  compressor: [8.8, 0, 3.2],
  airReceiver: [10.4, 0, 3.2],

  transformer: [-9.2, 0, -3.8],
  substation: [-11.6, 0, -1.6],

  gridMast: [-16.5, 0, -7.5],

  facilityBus: [0, 0.2, -3.9],
};

// Idle cinematic framing + per-equipment "fly-to" camera presets, in
// spherical terms around a target point (theta = azimuth, phi = polar
// angle from +Y, radius = distance).
export const IDLE_VIEW = { theta: 0.62, phi: 1.15, radius: 20.5, target: [-1.6, 2.3, -0.8] };

export const FOCUS_PRESETS = {
  ahu: { target: [0.2, 6.0, 2.2], radius: 5.5, theta: 0.4, phi: 0.95 },
  chillers: { target: [-2.3, 5.8, -1.6], radius: 5.5, theta: 0.5, phi: 0.95 },
  coolingTower: { target: [3.6, 6.2, -1.4], radius: 5, theta: 0.9, phi: 0.9 },
  compressor: { target: [8.8, 1.0, 3.2], radius: 4.5, theta: 0.35, phi: 1.05 },
  airReceiver: { target: [10.4, 1.2, 3.2], radius: 4, theta: 0.35, phi: 1.05 },
  transformer: { target: [-9.2, 1.0, -3.8], radius: 4.5, theta: -0.6, phi: 1.05 },
  substation: { target: [-11.6, 1.0, -1.6], radius: 5, theta: -0.7, phi: 1.0 },
  building: { target: [0, 3, 0], radius: 15, theta: 0.55, phi: 1.05 },
};
