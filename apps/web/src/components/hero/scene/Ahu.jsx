import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { COLORS } from "../palette.js";
import { Louvers, FanBlades } from "./Parts.jsx";

// Rooftop air handling unit: boxy sheet-metal housing, intake louvers, a
// service door panel, and a fan cowl whose ring emissive is driven by
// glowRef (the same story-state signal used for the "SOFT RAMP"/spike
// visual language established in the operational Twin).
export default function Ahu({ glowRef, spinRef, color = COLORS.energyCyan }) {
  const ringRef = useRef();
  useFrame(() => {
    if (ringRef.current) ringRef.current.material.emissiveIntensity = glowRef?.current ?? 0.25;
  });

  return (
    <group>
      <RoundedBox args={[1.7, 0.72, 1.3]} radius={0.05} smoothness={1} position={[0, 0.36, 0]}>
        <meshStandardMaterial color={COLORS.metalMid} roughness={0.65} metalness={0.4} />
      </RoundedBox>

      <group position={[-0.86, 0.36, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <Louvers count={6} width={1.1} height={0.6} />
      </group>

      <mesh position={[0.3, 0.36, 0.66]}>
        <boxGeometry args={[0.5, 0.55, 0.03]} />
        <meshStandardMaterial color={COLORS.metalDark} roughness={0.6} metalness={0.4} />
      </mesh>
      <mesh position={[0.52, 0.36, 0.68]}>
        <boxGeometry args={[0.03, 0.06, 0.03]} />
        <meshStandardMaterial color={COLORS.metalLight} metalness={0.7} />
      </mesh>

      <group position={[0.55, 0.72, 0]}>
        <mesh>
          <cylinderGeometry args={[0.34, 0.34, 0.09, 20]} />
          <meshStandardMaterial color={COLORS.metalDark} roughness={0.6} metalness={0.5} />
        </mesh>
        <mesh ref={ringRef} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.25, 0.31, 24]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} toneMapped={false} />
        </mesh>
        <group position={[0, 0.06, 0]}>
          <FanBlades radius={0.26} spinRef={spinRef} />
        </group>
      </group>

      {/* roof curb */}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[1.9, 0.05, 1.5]} />
        <meshStandardMaterial color={COLORS.concreteLight} roughness={0.9} />
      </mesh>
    </group>
  );
}
