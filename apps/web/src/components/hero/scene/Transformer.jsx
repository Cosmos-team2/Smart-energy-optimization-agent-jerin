import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { COLORS } from "../palette.js";

// Pad-mounted distribution transformer: tank body, radiator cooling fins,
// bushings, and a concrete pad. glowRef is fed the grid load ratio (this
// is the site's electrical intake — the "GRID -> TRANSFORMER" node).
export default function Transformer({ glowRef, color = COLORS.energyCyan }) {
  const bushingRefs = [useRef(), useRef(), useRef()];

  useFrame(() => {
    const g = glowRef?.current ?? 0.3;
    bushingRefs.forEach((r) => {
      if (r.current) r.current.material.emissiveIntensity = g;
    });
  });

  return (
    <group>
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[1.9, 0.1, 1.4]} />
        <meshStandardMaterial color={COLORS.concrete} roughness={0.95} />
      </mesh>

      <RoundedBox args={[1.5, 1.0, 0.9]} radius={0.04} smoothness={1} position={[0, 0.6, 0]}>
        <meshStandardMaterial color={COLORS.metalMid} roughness={0.55} metalness={0.5} />
      </RoundedBox>

      {/* radiator fins on both long sides */}
      {[-0.78, 0.78].map((x, side) =>
        Array.from({ length: 6 }).map((_, i) => (
          <mesh key={`${side}-${i}`} position={[x, 0.35 + i * 0.13, 0]}>
            <boxGeometry args={[0.04, 0.1, 1.0]} />
            <meshStandardMaterial color={COLORS.metalDark} roughness={0.6} metalness={0.5} />
          </mesh>
        ))
      )}

      {/* bushings on top */}
      {[-0.4, 0, 0.4].map((x, i) => (
        <group key={i} position={[x, 1.15, 0]}>
          <mesh>
            <cylinderGeometry args={[0.05, 0.07, 0.35, 10]} />
            <meshStandardMaterial color="#c9a24a" roughness={0.35} metalness={0.4} />
          </mesh>
          <mesh ref={bushingRefs[i]} position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.045, 10, 10]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* nameplate */}
      <mesh position={[0, 0.65, 0.46]}>
        <boxGeometry args={[0.4, 0.22, 0.02]} />
        <meshStandardMaterial color={COLORS.metalDark} roughness={0.5} metalness={0.6} />
      </mesh>
    </group>
  );
}
