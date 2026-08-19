import { RoundedBox } from "@react-three/drei";
import { COLORS } from "../palette.js";
import { LAYOUT } from "./layout.js";

// Main facility building: a large rounded industrial shell with a roof
// parapet and a strip of emissive "lit window" panels along the facade so
// it reads as an occupied building rather than a plain box.
// Window emissive slightly purple-tinted for the OptiGrid palette.
export default function Building() {
  const { width, height, depth } = LAYOUT.building;

  const windowCount = 9;
  const windowSpacing = (width - 1.2) / windowCount;

  return (
    <group>
      {/* Main shell */}
      <RoundedBox
        args={[width, height, depth]}
        radius={0.12}
        smoothness={2}
        position={[0, height / 2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={COLORS.metalMid} roughness={0.72} metalness={0.38} />
      </RoundedBox>

      {/* Roof parapet edge */}
      <mesh position={[0, height + 0.08, 0]}>
        <boxGeometry args={[width + 0.2, 0.16, depth + 0.2]} />
        <meshStandardMaterial color={COLORS.metalDark} roughness={0.7} metalness={0.4} />
      </mesh>
      <mesh position={[0, height + 0.02, 0]}>
        <boxGeometry args={[width - 0.3, 0.05, depth - 0.3]} />
        <meshStandardMaterial color={COLORS.concrete} roughness={0.9} />
      </mesh>

      {/* Facade window strip, front face — slightly purple-lit */}
      {Array.from({ length: windowCount }).map((_, i) => (
        <mesh
          key={i}
          position={[-width / 2 + 0.6 + windowSpacing * i, height * 0.62, depth / 2 + 0.03]}
        >
          <boxGeometry args={[windowSpacing * 0.55, height * 0.28, 0.03]} />
          <meshStandardMaterial
            color="#8870cc"
            emissive="#6040b0"
            emissiveIntensity={0.28}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Loading dock canopy */}
      <mesh position={[-width / 2 + 1.6, 1.55, depth / 2 + 0.5]}>
        <boxGeometry args={[2.4, 0.08, 1]} />
        <meshStandardMaterial color={COLORS.metalDark} roughness={0.6} metalness={0.5} />
      </mesh>
      <mesh position={[-width / 2 + 1.6, 0.75, depth / 2 + 0.02]}>
        <boxGeometry args={[2.2, 1.5, 0.05]} />
        <meshStandardMaterial color={COLORS.metalDark} roughness={0.8} />
      </mesh>

      {/* Side annex / utility wing */}
      <mesh position={[width / 2 + 1.0, height * 0.3, 1.0]}>
        <boxGeometry args={[2.0, height * 0.6, 2.8]} />
        <meshStandardMaterial color={COLORS.metalDark} roughness={0.78} metalness={0.3} />
      </mesh>

      {/* Base plinth */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[width + 0.4, 0.1, depth + 0.4]} />
        <meshStandardMaterial color={COLORS.concrete} roughness={0.95} />
      </mesh>
    </group>
  );
}
