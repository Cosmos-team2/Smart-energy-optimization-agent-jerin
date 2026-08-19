import { Grid } from "@react-three/drei";
import { COLORS } from "../palette.js";
import { LAYOUT } from "./layout.js";

function Pad({ position, radius = 1.3 }) {
  return (
    <mesh position={position} receiveShadow>
      <cylinderGeometry args={[radius, radius, 0.08, 28]} />
      <meshStandardMaterial color={COLORS.concreteLight} roughness={0.9} />
    </mesh>
  );
}

function PoleLight({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 2.2, 8]} />
        <meshStandardMaterial color={COLORS.metalDark} roughness={0.7} />
      </mesh>
      <mesh position={[0, 2.2, 0]}>
        <coneGeometry args={[0.14, 0.16, 8]} />
        <meshStandardMaterial color={COLORS.metalDark} roughness={0.6} metalness={0.4} />
      </mesh>
      <mesh position={[0, 2.1, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color={COLORS.warnAmber} emissive={COLORS.warnAmber} emissiveIntensity={0.6} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 2.05, 0]} color={COLORS.warnAmber} intensity={1.2} distance={6} decay={2} />
    </group>
  );
}

// Ground plane, technical grid, service road connecting the equipment
// pads, and a handful of perimeter lights for atmosphere.
export default function Environment() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color={COLORS.bg} roughness={1} />
      </mesh>

      <Grid
        args={[80, 80]}
        cellSize={1.5}
        cellThickness={0.4}
        cellColor="#122127"
        sectionSize={7.5}
        sectionThickness={0.8}
        sectionColor="#1c3a3f"
        fadeDistance={42}
        fadeStrength={1.4}
        infiniteGrid={false}
        position={[0, -0.015, 0]}
      />

      {/* service road ring connecting equipment clusters */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1, 0.005, -0.5]}>
        <ringGeometry args={[9.2, 10.4, 64, 1, Math.PI * 0.15, Math.PI * 1.5]} />
        <meshStandardMaterial color="#0e1215" roughness={0.95} />
      </mesh>

      <Pad position={LAYOUT.compressor} radius={1.1} />
      <Pad position={LAYOUT.airReceiver} radius={0.7} />
      <Pad position={LAYOUT.transformer} radius={1.4} />
      <Pad position={LAYOUT.substation} radius={1.6} />
      <Pad position={LAYOUT.gridMast} radius={1.2} />

      <PoleLight position={[6.5, 0, -6]} />
      <PoleLight position={[-6.5, 0, 5.5]} />
      <PoleLight position={[13, 0, 0]} />
    </group>
  );
}
