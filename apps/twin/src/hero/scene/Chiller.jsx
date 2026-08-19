import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { COLORS } from "../palette.js";
import { Louvers, FanBlades, Bolt } from "./Parts.jsx";

// Packaged air-cooled chiller: a low cabinet with condenser louvers on both
// long faces and two fan cowls on top. glowRef drives the fan-cowl ring
// emissive (SOFT RAMP tint during rec_042 story beats).
export default function Chiller({ glowRef, spinRef, color = COLORS.energyCyan }) {
  const ringRefs = [useRef(), useRef()];

  useFrame(() => {
    const intensity = glowRef?.current ?? 0.25;
    ringRefs.forEach((r) => {
      if (r.current) r.current.emissiveIntensity = intensity;
    });
  });

  return (
    <group>
      <RoundedBox args={[1.9, 0.85, 0.95]} radius={0.05} smoothness={1} position={[0, 0.425, 0]}>
        <meshStandardMaterial color={COLORS.metalMid} roughness={0.6} metalness={0.5} />
      </RoundedBox>

      <group position={[0, 0.425, 0.48]}>
        <Louvers count={7} width={1.7} height={0.7} />
      </group>
      <group position={[0, 0.425, -0.48]} rotation={[0, Math.PI, 0]}>
        <Louvers count={7} width={1.7} height={0.7} />
      </group>

      {[-0.5, 0.5].map((x, i) => (
        <group key={i} position={[x, 0.87, 0]}>
          <mesh>
            <cylinderGeometry args={[0.32, 0.32, 0.1, 20]} />
            <meshStandardMaterial color={COLORS.metalDark} roughness={0.6} metalness={0.5} />
          </mesh>
          <mesh ref={ringRefs[i]} position={[0, 0.052, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.24, 0.29, 24]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} toneMapped={false} />
          </mesh>
          <group position={[0, 0.06, 0]}>
            <FanBlades radius={0.24} spinRef={spinRef} />
          </group>
        </group>
      ))}

      {[[-0.85, 0.05, 0.42], [0.85, 0.05, 0.42], [-0.85, 0.05, -0.42], [0.85, 0.05, -0.42]].map((p, i) => (
        <group key={i} position={p}>
          <Bolt radius={0.03} />
        </group>
      ))}
    </group>
  );
}
