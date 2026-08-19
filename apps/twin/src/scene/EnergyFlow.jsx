import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";

// ratio (0..1+) is value/max derived from real spike-data.json readings;
// spike is that same zone's is_spike_event flag. Both only control particle
// count/speed/size, never the underlying data.
export default function EnergyFlow({ start, end, ratio, color, spike }) {
  const startVec = useMemo(() => new THREE.Vector3(start[0], 3.1, start[2]), [start]);
  const endVec = useMemo(() => new THREE.Vector3(end[0], 1.1, end[2]), [end]);

  const count = 2 + Math.round(Math.min(1, ratio) * 4) + (spike ? 3 : 0);
  const particleRefs = useRef([]);
  const particleSize = spike ? 0.13 : 0.09;

  useFrame(({ clock }) => {
    const speed = 0.35 + Math.min(1, ratio) * 1.3 + (spike ? 1.1 : 0);
    for (let i = 0; i < count; i++) {
      const mesh = particleRefs.current[i];
      if (!mesh) continue;
      const offset = i / count;
      const t = (clock.getElapsedTime() * speed + offset) % 1;
      mesh.position.lerpVectors(startVec, endVec, t);
    }
  });

  return (
    <group>
      <Line
        points={[startVec, endVec]}
        color={color}
        transparent
        opacity={spike ? 0.5 : 0.25}
        lineWidth={spike ? 1.5 : 1}
      />
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} ref={(el) => (particleRefs.current[i] = el)}>
          <sphereGeometry args={[particleSize, 8, 8]} />
          <meshBasicMaterial color={spike ? "#ff4d4f" : color} />
        </mesh>
      ))}
    </group>
  );
}
