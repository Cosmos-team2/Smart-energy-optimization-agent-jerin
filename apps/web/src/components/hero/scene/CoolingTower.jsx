import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { COLORS } from "../palette.js";
import { FanBlades } from "./Parts.jsx";

// Mechanical-draft cooling tower: octagonal louvered body with a fan cap.
export default function CoolingTower({ spinRef }) {
  const slats = 12;
  const capRef = useRef();

  useFrame((_, delta) => {
    if (capRef.current) capRef.current.rotation.y += delta * 0.15;
  });

  return (
    <group>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.68, 0.72, 1.1, 10]} />
        <meshStandardMaterial color={COLORS.metalMid} roughness={0.8} metalness={0.2} />
      </mesh>
      {Array.from({ length: slats }).map((_, i) => {
        const angle = (i / slats) * Math.PI * 2;
        const r = 0.7;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * r, 0.55, Math.sin(angle) * r]}
            rotation={[0, -angle, 0]}
          >
            <boxGeometry args={[0.02, 0.9, 0.14]} />
            <meshStandardMaterial color={COLORS.metalDark} roughness={0.7} metalness={0.3} />
          </mesh>
        );
      })}

      <mesh position={[0, 1.16, 0]}>
        <cylinderGeometry args={[0.74, 0.68, 0.12, 10]} />
        <meshStandardMaterial color={COLORS.metalDark} roughness={0.6} metalness={0.4} />
      </mesh>

      <group ref={capRef} position={[0, 1.34, 0]}>
        <mesh>
          <cylinderGeometry args={[0.5, 0.58, 0.22, 10]} />
          <meshStandardMaterial color={COLORS.metalLight} roughness={0.5} metalness={0.5} />
        </mesh>
        <mesh position={[0, 0.16, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.22, 8]} />
          <meshStandardMaterial color={COLORS.metalDark} roughness={0.5} metalness={0.6} />
        </mesh>
        <group position={[0, 0.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <FanBlades radius={0.34} spinRef={spinRef} />
        </group>
      </group>
    </group>
  );
}
