import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { COLORS } from "../palette.js";
import { StatusLight } from "./Parts.jsx";

// Electrical switchgear yard: a small fenced pad holding a switchgear
// cabinet lineup (z_baseload_1's real-world equivalent) plus a single
// insulator pole. LED strip lights react to glowRef.
export default function Substation({ glowRef, color = COLORS.energyCyan }) {
  const ledGlow = useRef(0.7);
  useFrame(() => {
    ledGlow.current = glowRef?.current ?? 0.7;
  });

  const bays = 3;
  const bayWidth = 0.6;

  return (
    <group>
      {/* concrete pad */}
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[bays * bayWidth + 0.4, 0.06, 1.1]} />
        <meshStandardMaterial color={COLORS.concrete} roughness={0.95} />
      </mesh>

      {/* switchgear cabinet lineup */}
      {Array.from({ length: bays }).map((_, i) => {
        const x = -((bays - 1) * bayWidth) / 2 + i * bayWidth;
        return (
          <group key={i} position={[x, 0.5, 0]}>
            <mesh>
              <boxGeometry args={[bayWidth - 0.06, 1.0, 0.6]} />
              <meshStandardMaterial color={COLORS.metalMid} roughness={0.6} metalness={0.4} />
            </mesh>
            <mesh position={[0, 0.1, 0.31]}>
              <boxGeometry args={[bayWidth - 0.16, 0.7, 0.02]} />
              <meshStandardMaterial color={COLORS.metalDark} roughness={0.7} metalness={0.3} />
            </mesh>
            <StatusLight position={[0, 0.42, 0.32]} color={color} glowRef={ledGlow} size={0.03} />
          </group>
        );
      })}

      {/* perimeter posts + rail (light fence suggestion, not full chainlink) */}
      {[-bays * bayWidth * 0.5 - 0.3, bays * bayWidth * 0.5 + 0.3].map((x, i) => (
        <group key={i}>
          {[-0.6, 0.6].map((z, j) => (
            <mesh key={j} position={[x, 0.5, z]}>
              <cylinderGeometry args={[0.02, 0.02, 1, 6]} />
              <meshStandardMaterial color={COLORS.metalDark} roughness={0.7} metalness={0.3} />
            </mesh>
          ))}
        </group>
      ))}

      {/* insulator pole at one corner */}
      <group position={[bays * bayWidth * 0.5 + 0.3, 0, -0.9]}>
        <mesh position={[0, 1.1, 0]}>
          <cylinderGeometry args={[0.045, 0.06, 2.2, 8]} />
          <meshStandardMaterial color={COLORS.metalDark} roughness={0.7} metalness={0.3} />
        </mesh>
        <mesh position={[0, 2.1, 0]}>
          <boxGeometry args={[0.6, 0.05, 0.05]} />
          <meshStandardMaterial color={COLORS.metalDark} roughness={0.7} metalness={0.3} />
        </mesh>
        {[-0.25, 0.25].map((x, i) => (
          <mesh key={i} position={[x, 1.98, 0]}>
            <cylinderGeometry args={[0.03, 0.05, 0.18, 8]} />
            <meshStandardMaterial color="#8a8f94" roughness={0.4} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
