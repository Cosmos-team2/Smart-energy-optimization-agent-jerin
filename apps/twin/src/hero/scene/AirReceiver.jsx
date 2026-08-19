import { COLORS } from "../palette.js";
import { Gauge } from "./Parts.jsx";

// Vertical compressed-air receiver tank: cylinder + dome caps + legs, a
// pressure gauge, and a relief-valve stub. Kept procedural (not imported)
// since it's near-identical to primitives we already build elsewhere.
export default function AirReceiver() {
  return (
    <group>
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.36, 0.36, 1.5, 20]} />
        <meshStandardMaterial color={COLORS.metalLight} roughness={0.4} metalness={0.55} />
      </mesh>
      <mesh position={[0, 1.75, 0]}>
        <sphereGeometry args={[0.36, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={COLORS.metalLight} roughness={0.4} metalness={0.55} />
      </mesh>
      <mesh position={[0, 0.25, 0]} rotation={[Math.PI, 0, 0]}>
        <sphereGeometry args={[0.36, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={COLORS.metalLight} roughness={0.4} metalness={0.55} />
      </mesh>

      {[-0.24, 0.24].map((x, i) => (
        <mesh key={i} position={[x, 0.12, 0]}>
          <boxGeometry args={[0.08, 0.24, 0.3]} />
          <meshStandardMaterial color={COLORS.metalDark} roughness={0.7} />
        </mesh>
      ))}

      <group position={[0.38, 1.4, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <Gauge radius={0.08} />
      </group>

      <mesh position={[0, 1.95, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.14, 8]} />
        <meshStandardMaterial color={COLORS.metalDark} roughness={0.5} metalness={0.6} />
      </mesh>
    </group>
  );
}
