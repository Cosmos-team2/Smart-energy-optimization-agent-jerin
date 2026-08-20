import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { COLORS } from "../palette.js";

// ratio (0..1+) is value/max derived from real spike-data.json readings;
// spike is that same zone's is_spike_event flag. Both only control particle
// count/speed/size/color, never the underlying data. Path is a gentle curve
// (not a straight laser) between the grid source and the equipment zone.
export default function EnergyFlow({ start, end, ratio, spike }) {
  const curve = useMemo(() => {
    const a = new THREE.Vector3(start[0], 2.9, start[2]);
    const b = new THREE.Vector3(end[0], 1.05, end[2]);
    const mid = a.clone().lerp(b, 0.5);
    mid.y += 0.9;
    mid.x += (end[0] - start[0]) * 0.12;
    return new THREE.QuadraticBezierCurve3(a, mid, b);
  }, [start, end]);

  const linePoints = useMemo(() => curve.getPoints(28), [curve]);

  const count = 2 + Math.round(Math.min(1, ratio) * 4) + (spike ? 3 : 0);
  const particleRefs = useRef([]);
  const particleSize = spike ? 0.11 : 0.075;
  const flowColor = spike ? COLORS.warnRed : ratio > 0.55 ? COLORS.energyCyan : COLORS.purpleGlow;
  const lineMatRef = useRef();

  useFrame(({ clock }) => {
    const speed = 0.3 + Math.min(1, ratio) * 1.1 + (spike ? 1.3 : 0);
    for (let i = 0; i < count; i++) {
      const mesh = particleRefs.current[i];
      if (!mesh) continue;
      const offset = i / count;
      const t = (clock.getElapsedTime() * speed + offset) % 1;
      curve.getPointAt(t, mesh.position);
    }
  });

  return (
    <group>
      <Line
        ref={lineMatRef}
        points={linePoints}
        color={flowColor}
        transparent
        opacity={spike ? 0.55 : 0.3}
        lineWidth={spike ? 1.6 : 1}
      />
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} ref={(el) => (particleRefs.current[i] = el)}>
          <sphereGeometry args={[particleSize, 8, 8]} />
          <meshStandardMaterial color={flowColor} emissive={flowColor} emissiveIntensity={0.9} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}
