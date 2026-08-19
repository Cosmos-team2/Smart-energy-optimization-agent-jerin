import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { LAYOUT } from "./layout.js";
import { STATE_STYLE, channelsForPhase } from "./energyStates.js";

function Conduit({ points, state }) {
  const style = STATE_STYLE[state];
  const vecs = points.map((p) => new THREE.Vector3(...p));
  const particleRefs = useRef([]);
  const count = style.count;

  useFrame(({ clock }) => {
    const segCount = vecs.length - 1;
    for (let i = 0; i < count; i++) {
      const mesh = particleRefs.current[i];
      if (!mesh) continue;
      const offset = i / count;
      const t = (clock.getElapsedTime() * style.speed + offset) % 1;
      const scaled = t * segCount;
      const segIdx = Math.min(Math.floor(scaled), segCount - 1);
      const localT = scaled - segIdx;
      mesh.position.lerpVectors(vecs[segIdx], vecs[segIdx + 1], localT);
    }
  });

  return (
    <group>
      <Line points={vecs} color={style.color} transparent opacity={0.28} lineWidth={1} />
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} ref={(el) => (particleRefs.current[i] = el)}>
          <sphereGeometry args={[style.size, 8, 8]} />
          <meshBasicMaterial color={style.color} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

// GRID -> TRANSFORMER -> FACILITY -> HVAC, with FACILITY -> COMPRESSOR as a
// branch. `phase` is the hero's story state (normal/peak/transition/optimized).
export default function EnergyNetwork({ phase }) {
  const channels = channelsForPhase(phase);

  const gridTop = [LAYOUT.gridMast[0], 4.6, LAYOUT.gridMast[2]];
  const transformerTop = [LAYOUT.transformer[0], 1.15, LAYOUT.transformer[2]];
  const bus = LAYOUT.facilityBus;
  const ahuPoint = [LAYOUT.ahu[0], LAYOUT.roofY + 0.4, LAYOUT.ahu[2]];
  const compressorPoint = [LAYOUT.compressor[0], 0.9, LAYOUT.compressor[2]];

  return (
    <group>
      <Conduit points={[gridTop, transformerTop]} state={channels.trunk} />
      <Conduit points={[transformerTop, [transformerTop[0], 0.3, transformerTop[2]], bus]} state={channels.trunk} />
      <Conduit points={[bus, [0, LAYOUT.roofY + 0.4, bus[2]], ahuPoint]} state={channels.hvac} />
      <Conduit points={[bus, [4, 0.9, 0], compressorPoint]} state={channels.compressor} />
    </group>
  );
}
