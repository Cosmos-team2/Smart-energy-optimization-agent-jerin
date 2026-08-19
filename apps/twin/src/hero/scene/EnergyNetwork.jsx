import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { QuadraticBezierLine } from "@react-three/drei";
import * as THREE from "three";
import { LAYOUT } from "./layout.js";
import { STATE_STYLE, channelsForPhase } from "./energyStates.js";
import { COLORS } from "../palette.js";

// Sample N evenly-spaced points along a quadratic bezier for particle travel
function sampleBezier(start, ctrl, end, count) {
  const pts = [];
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const x = (1 - t) * (1 - t) * start[0] + 2 * (1 - t) * t * ctrl[0] + t * t * end[0];
    const y = (1 - t) * (1 - t) * start[1] + 2 * (1 - t) * t * ctrl[1] + t * t * end[1];
    const z = (1 - t) * (1 - t) * start[2] + 2 * (1 - t) * t * ctrl[2] + t * t * end[2];
    pts.push(new THREE.Vector3(x, y, z));
  }
  return pts;
}

// A curved conduit between two world-space points. A control point is
// automatically lifted above the midpoint to create an arc shape.
// The primary flow color is OptiGrid purple for trunk lines; equipment
// channels inherit from the energyStates STATE_STYLE.
function CurvedConduit({ start, end, ctrl, state, colorOverride }) {
  const style = STATE_STYLE[state];
  const lineColor = colorOverride ?? style.color;
  const count = style.count;
  const particleRefs = useRef([]);

  const path = useMemo(
    () => sampleBezier(start, ctrl, end, 48),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [start[0], start[1], start[2], end[0], end[1], end[2], ctrl[0], ctrl[1], ctrl[2]]
  );

  useFrame(({ clock }) => {
    for (let i = 0; i < count; i++) {
      const mesh = particleRefs.current[i];
      if (!mesh) continue;
      const offset = i / count;
      const t = (clock.getElapsedTime() * style.speed * 0.22 + offset) % 1;
      const idx = Math.min(Math.floor(t * (path.length - 1)), path.length - 2);
      const frac = t * (path.length - 1) - idx;
      mesh.position.lerpVectors(path[idx], path[idx + 1], frac);
    }
  });

  const startV = new THREE.Vector3(...start);
  const endV = new THREE.Vector3(...end);
  const ctrlV = new THREE.Vector3(...ctrl);

  return (
    <group>
      {/* Glowing conduit line */}
      <QuadraticBezierLine
        start={startV}
        end={endV}
        mid={ctrlV}
        color={lineColor}
        lineWidth={1.2}
        transparent
        opacity={0.22}
      />
      {/* Particles traveling along the arc */}
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} ref={(el) => (particleRefs.current[i] = el)}>
          <sphereGeometry args={[style.size, 7, 7]} />
          <meshBasicMaterial color={lineColor} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

// Helper: midpoint + vertical lift for an arc control point
function arcCtrl(a, b, lift = 2.5) {
  return [
    (a[0] + b[0]) / 2,
    Math.max(a[1], b[1]) + lift,
    (a[2] + b[2]) / 2,
  ];
}

// GRID → TRANSFORMER → FACILITY → HVAC / COMPRESSOR / SUBSTATION
// Purple is the primary trunk color per the OptiGrid spec;
// equipment channels keep their state-driven colors (cyan / amber / red).
export default function EnergyNetwork({ phase }) {
  const channels = channelsForPhase(phase);

  // Key world positions
  const gridTop = [LAYOUT.gridMast[0], 4.6, LAYOUT.gridMast[2]];
  const transformerTop = [LAYOUT.transformer[0], 1.15, LAYOUT.transformer[2]];
  const bus = LAYOUT.facilityBus;
  const ahuPoint = [LAYOUT.ahu[0], LAYOUT.roofY + 0.4, LAYOUT.ahu[2]];
  const compressorPoint = [LAYOUT.compressor[0], 0.9, LAYOUT.compressor[2]];
  const substationPoint = [LAYOUT.substation[0], 0.8, LAYOUT.substation[2]];

  // Purple trunk color overrides (non-risk state)
  const trunkColor =
    channels.trunk === "hot"
      ? COLORS.warnRed
      : channels.trunk === "warm"
      ? COLORS.warnAmber
      : COLORS.purple;

  return (
    <group>
      {/* GRID → TRANSFORMER  — main trunk, always purple */}
      <CurvedConduit
        start={gridTop}
        end={transformerTop}
        ctrl={arcCtrl(gridTop, transformerTop, 3.5)}
        state={channels.trunk}
        colorOverride={trunkColor}
      />

      {/* TRANSFORMER → FACILITY BUS */}
      <CurvedConduit
        start={transformerTop}
        end={bus}
        ctrl={arcCtrl(transformerTop, bus, 2.0)}
        state={channels.trunk}
        colorOverride={trunkColor}
      />

      {/* FACILITY BUS → AHU/HVAC */}
      <CurvedConduit
        start={bus}
        end={ahuPoint}
        ctrl={arcCtrl(bus, ahuPoint, 3.0)}
        state={channels.hvac}
      />

      {/* FACILITY BUS → COMPRESSOR */}
      <CurvedConduit
        start={bus}
        end={compressorPoint}
        ctrl={arcCtrl(bus, compressorPoint, 2.0)}
        state={channels.compressor}
      />

      {/* FACILITY BUS → SUBSTATION (base load) */}
      <CurvedConduit
        start={bus}
        end={substationPoint}
        ctrl={arcCtrl(bus, substationPoint, 1.8)}
        state="calm"
        colorOverride={COLORS.purple}
      />
    </group>
  );
}
