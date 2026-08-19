import { Grid } from "@react-three/drei";
import { COLORS } from "../palette.js";
import { POWER_NODE_POSITION, ELECTRICAL_ROOM_POSITION, FACILITY_BOUNDS } from "./config.js";

// Dark architectural ground for the facility campus — faint technical grid,
// a service corridor connecting grid -> electrical room -> facility, walkway
// stubs into each room, distant silhouettes for depth, and sparse pole
// lights. Kept minimal per spec: enough to read as one real site plan, not
// dense scenery.
const WALKWAYS = [
  { x: 0, z1: -1.8, z2: -1.1 }, // baseload hall access
  { x: -3.2, z1: 1.3, z2: 3.2 }, // hvac room access
  { x: 3.2, z1: 1.3, z2: 3.2 }, // compressor room access
];

const SILHOUETTES = [
  [-16, -13, 2.2, 3.4],
  [-12, -16, 1.6, 4.2],
  [13, -14, 2.0, 3.8],
  [17, -10, 1.4, 2.6],
  [-18, 4, 1.8, 3.0],
  [18, 3, 1.5, 3.6],
  [-15, 9, 1.6, 2.4],
  [15, 8, 1.7, 2.8],
];

const POLE_LIGHTS = [
  [-9.5, -3],
  [9.5, -3],
  [-9.5, 5.5],
  [9.5, 5.5],
];

export default function Floor() {
  const gridZ = POWER_NODE_POSITION[2];
  const elecZ = ELECTRICAL_ROOM_POSITION[2];
  const facilityBackZ = FACILITY_BOUNDS.minZ;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[64, 64]} />
        <meshStandardMaterial color={COLORS.floor} roughness={0.85} metalness={0.12} />
      </mesh>
      <Grid
        position={[0, 0, 0]}
        args={[64, 64]}
        cellSize={1}
        cellThickness={0.4}
        cellColor="#26223a"
        sectionSize={5}
        sectionThickness={0.8}
        sectionColor="#3f3358"
        fadeDistance={34}
        fadeStrength={1.5}
        infiniteGrid={false}
      />

      {/* service road: grid -> electrical room */}
      <RoadStrip x={0} z1={gridZ} z2={elecZ} width={1.1} />
      {/* corridor: electrical room -> main facility */}
      <RoadStrip x={0} z1={elecZ} z2={facilityBackZ} width={0.9} />

      {/* walkway stubs into each room */}
      {WALKWAYS.map((w, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[w.x, -0.006, (w.z1 + w.z2) / 2]}>
          <planeGeometry args={[0.7, Math.abs(w.z2 - w.z1)]} />
          <meshStandardMaterial color="#1c1930" roughness={0.9} />
        </mesh>
      ))}

      {/* sparse pole lights for depth/atmosphere */}
      {POLE_LIGHTS.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 1.1, 0]}>
            <cylinderGeometry args={[0.03, 0.04, 2.2, 8]} />
            <meshStandardMaterial color={COLORS.metalDark} roughness={0.6} metalness={0.4} />
          </mesh>
          <mesh position={[0, 2.2, 0]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color={COLORS.purpleGlow} emissive={COLORS.purpleGlow} emissiveIntensity={0.7} toneMapped={false} />
          </mesh>
          <pointLight position={[0, 2.2, 0]} color={COLORS.purpleGlow} intensity={0.7} distance={6} />
        </group>
      ))}

      {/* distant silhouettes — sell scale/depth without detail or cost */}
      {SILHOUETTES.map(([x, z, w, h], i) => (
        <mesh key={i} position={[x, h / 2, z]}>
          <boxGeometry args={[w, h, w]} />
          <meshBasicMaterial color="#100d1c" transparent opacity={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function RoadStrip({ x, z1, z2, width }) {
  const len = Math.abs(z2 - z1);
  const cz = (z1 + z2) / 2;
  const dashCount = Math.max(2, Math.round(len / 0.7));
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.005, cz]}>
        <planeGeometry args={[width, len]} />
        <meshStandardMaterial color="#181529" roughness={0.9} />
      </mesh>
      {Array.from({ length: dashCount }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.003, Math.min(z1, z2) + 0.35 + i * 0.7]}>
          <planeGeometry args={[0.06, 0.28]} />
          <meshStandardMaterial color={COLORS.purpleTrace} transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}
