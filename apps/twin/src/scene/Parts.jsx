import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { COLORS } from "../palette.js";

// Small reusable "greeble" primitives shared across the procedurally-built
// twin equipment, so every machine reads as built from consistent parts
// rather than one-off shapes. Adapted from apps/hero/src/scene/Parts.jsx as
// an independent copy — twin never imports from hero.

export function Louvers({ count = 6, width = 0.9, height = 0.7, color = COLORS.metalDark }) {
  const gap = height / count;
  return (
    <group>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} position={[0, -height / 2 + gap * i + gap / 2, 0.02]}>
          <boxGeometry args={[width, gap * 0.55, 0.03]} />
          <meshStandardMaterial color={color} roughness={0.7} metalness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

export function FanBlades({ radius = 0.42, color = COLORS.metalLight, spinRef }) {
  const groupRef = useRef();
  useFrame((_, delta) => {
    const speed = spinRef?.current ?? 1.2;
    if (groupRef.current) groupRef.current.rotation.z += delta * speed;
  });
  return (
    <group ref={groupRef}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} rotation={[0, 0, (Math.PI / 2) * i]}>
          <boxGeometry args={[radius * 1.8, radius * 0.32, 0.03]} />
          <meshStandardMaterial color={color} roughness={0.5} metalness={0.6} />
        </mesh>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius * 0.18, radius * 0.18, 0.08, 12]} />
        <meshStandardMaterial color={COLORS.metalDark} roughness={0.5} metalness={0.7} />
      </mesh>
    </group>
  );
}

export function Gauge({ radius = 0.09, glowRef, color = COLORS.energyCyan }) {
  const matRef = useRef();
  useFrame(() => {
    if (matRef.current) matRef.current.emissiveIntensity = glowRef?.current ?? 0.4;
  });
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius, radius, 0.02, 16]} />
        <meshStandardMaterial color="#0a0d10" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.012]}>
        <circleGeometry args={[radius * 0.7, 16]} />
        <meshStandardMaterial ref={matRef} color={color} emissive={color} emissiveIntensity={0.4} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function Bolt({ radius = 0.025 }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[radius, radius, radius * 0.6, 6]} />
      <meshStandardMaterial color={COLORS.metalLight} roughness={0.4} metalness={0.8} />
    </mesh>
  );
}

// Straight pipe run between two points, with sphere caps.
export function PipeRun({ from, to, radius = 0.08, color = COLORS.metalLight }) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const mid = a.clone().lerp(b, 0.5);
  const dir = b.clone().sub(a);
  const len = dir.length();
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return (
    <group>
      <mesh position={mid} quaternion={quat}>
        <cylinderGeometry args={[radius, radius, len, 10]} />
        <meshStandardMaterial color={color} roughness={0.45} metalness={0.6} />
      </mesh>
      <mesh position={a}>
        <sphereGeometry args={[radius * 1.15, 10, 10]} />
        <meshStandardMaterial color={color} roughness={0.45} metalness={0.6} />
      </mesh>
      <mesh position={b}>
        <sphereGeometry args={[radius * 1.15, 10, 10]} />
        <meshStandardMaterial color={color} roughness={0.45} metalness={0.6} />
      </mesh>
    </group>
  );
}

// L-shaped pipe run through intermediate elbow points.
export function ElbowPipe({ points, radius = 0.08, color = COLORS.metalLight }) {
  const segments = [];
  for (let i = 0; i < points.length - 1; i++) {
    segments.push(<PipeRun key={i} from={points[i]} to={points[i + 1]} radius={radius} color={color} />);
  }
  return <group>{segments}</group>;
}

export function StatusLight({ position = [0, 0, 0], color = COLORS.energyCyan, glowRef, size = 0.05 }) {
  const matRef = useRef();
  useFrame(() => {
    if (matRef.current) matRef.current.emissiveIntensity = glowRef?.current ?? 0.8;
  });
  return (
    <mesh position={position}>
      <sphereGeometry args={[size, 8, 8]} />
      <meshStandardMaterial ref={matRef} color={color} emissive={color} emissiveIntensity={0.8} toneMapped={false} />
    </mesh>
  );
}
