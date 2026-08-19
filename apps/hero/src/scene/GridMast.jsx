import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { COLORS } from "../palette.js";

// Incoming-grid transmission mast: the visual origin of the energy network,
// upstream of the transformer. Simple lattice pylon silhouette.
export default function GridMast({ glowRef, color = COLORS.energyCyan }) {
  const glowRefs = [useRef(), useRef(), useRef()];
  useFrame(() => {
    const g = glowRef?.current ?? 0.6;
    glowRefs.forEach((r) => {
      if (r.current) r.current.material.emissiveIntensity = g;
    });
  });

  return (
    <group>
      <mesh position={[0, 3.2, 0]}>
        <cylinderGeometry args={[0.08, 0.22, 6.4, 4]} />
        <meshStandardMaterial color={COLORS.metalDark} roughness={0.7} metalness={0.4} />
      </mesh>
      {[2.2, 3.4, 4.6].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <boxGeometry args={[1.4 - i * 0.3, 0.06, 0.06]} />
          <meshStandardMaterial color={COLORS.metalDark} roughness={0.7} metalness={0.4} />
        </mesh>
      ))}
      {[2.2, 3.4, 4.6].map((y, i) => (
        <group key={i}>
          {[-1, 1].map((s, j) => (
            <mesh key={j} ref={glowRefs[(i + j) % 3]} position={[s * (0.75 - i * 0.15), y - 0.15, 0]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} toneMapped={false} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
