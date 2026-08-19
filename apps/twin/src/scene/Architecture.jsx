import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, Text, Billboard } from "@react-three/drei";
import { COLORS, VIEW_MODE_OPACITY } from "../palette.js";
import {
  POWER_NODE_POSITION,
  ELECTRICAL_ROOM_POSITION,
  ELECTRICAL_ROOM_SIZE,
  FACILITY_BOUNDS,
  BACK_HALL_SPLIT_Z,
  FRONT_ROOM_SPLIT_X,
} from "./config.js";

const WALL_H = 2.4;
const ELEC_H = 2.0;

// Static campus architecture — building envelope, room partitions, roof and
// the small electrical room, all with semi-transparent walls so equipment
// stays visible through them at every zoom level. Purely presentational (no
// telemetry drives it): it exists so the scene reads as ONE explorable
// facility with a real floor plan instead of three floating objects.
//
// viewMode: "exterior" | "cutaway" | "floorplan" — controls wall/roof
// translucency only; geometry never changes.
export default function Architecture({ viewMode = "exterior" }) {
  const { wall: wallOpacity, roof: roofOpacity } = VIEW_MODE_OPACITY[viewMode] || VIEW_MODE_OPACITY.exterior;
  const planOpacity = viewMode === "floorplan" ? 0.85 : viewMode === "cutaway" ? 0.5 : 0.3;

  const { minX, maxX, minZ, maxZ } = FACILITY_BOUNDS;
  const midZ = BACK_HALL_SPLIT_Z;
  const midX = FRONT_ROOM_SPLIT_X;

  return (
    <group>
      <ElectricalRoom wallOpacity={wallOpacity} roofOpacity={roofOpacity} />

      {/* corridor connecting the electrical room to the main facility */}
      <FloorOutline
        points={[
          [-1, minZ],
          [1, minZ],
          [1, minZ - 1.6],
          [-1, minZ - 1.6],
          [-1, minZ],
        ]}
        opacity={planOpacity * 0.6}
      />

      {/* ---- main facility envelope ---- */}
      {/* west / east outer walls, split at the back-hall / front-room line */}
      <WallSeg x={minX} z={(minZ + midZ) / 2} w={0.14} d={midZ - minZ} h={WALL_H} opacity={wallOpacity} />
      <WallSeg x={maxX} z={(minZ + midZ) / 2} w={0.14} d={midZ - minZ} h={WALL_H} opacity={wallOpacity} />
      <WallSeg x={minX} z={(midZ + maxZ) / 2} w={0.14} d={maxZ - midZ} h={WALL_H} opacity={wallOpacity} />
      <WallSeg x={maxX} z={(midZ + maxZ) / 2} w={0.14} d={maxZ - midZ} h={WALL_H} opacity={wallOpacity} />

      {/* back wall, with a door gap toward the electrical-room corridor */}
      <DoorWall axis="x" fixed={minZ} from={minX} to={maxX} gapFrom={-1} gapTo={1} thickness={0.14} height={WALL_H} opacity={wallOpacity} />

      {/* front wall (north face) */}
      <WallSeg x={0} z={maxZ} w={maxX - minX} d={0.14} h={WALL_H} opacity={wallOpacity} />

      {/* partition: baseload hall <-> front rooms, with a walk-through gap */}
      <DoorWall axis="x" fixed={midZ} from={minX} to={maxX} gapFrom={-1} gapTo={1} thickness={0.12} height={WALL_H} opacity={wallOpacity} />

      {/* partition: HVAC room <-> compressor room */}
      <WallSeg x={midX} z={(midZ + maxZ) / 2} w={0.12} d={maxZ - midZ} h={WALL_H} opacity={wallOpacity} />

      {/* clerestory accent band — stylized "windows" running the outer walls */}
      <AccentBand x={minX} z={(minZ + maxZ) / 2} w={0.03} d={maxZ - minZ} y={WALL_H * 0.72} />
      <AccentBand x={maxX} z={(minZ + maxZ) / 2} w={0.03} d={maxZ - minZ} y={WALL_H * 0.72} />

      {/* roof slab + parapet + rooftop greebles */}
      <Roof bounds={FACILITY_BOUNDS} height={WALL_H} opacity={roofOpacity} />

      {/* room floor fills — lighter than the exterior ground so each room
          reads clearly even when the roof above is mostly transparent */}
      <RoomFloor x={(minX + maxX) / 2} z={(minZ + midZ) / 2} w={maxX - minX - 0.2} d={midZ - minZ - 0.2} />
      <RoomFloor x={(minX + midX) / 2} z={(midZ + maxZ) / 2} w={midX - minX - 0.2} d={maxZ - midZ - 0.2} />
      <RoomFloor x={(midX + maxX) / 2} z={(midZ + maxZ) / 2} w={maxX - midX - 0.2} d={maxZ - midZ - 0.2} />

      {/* floor plan outline (room footprints traced on the floor) */}
      <FloorOutline points={rectPoints(minX, minZ, maxX, midZ)} opacity={planOpacity} />
      <FloorOutline points={rectPoints(minX, midZ, midX, maxZ)} opacity={planOpacity} />
      <FloorOutline points={rectPoints(midX, midZ, maxX, maxZ)} opacity={planOpacity} />

      {/* room labels */}
      <RoomLabel position={[0, 0.02, minZ + 0.55]} text="BASELOAD HALL" opacity={planOpacity} />
      <RoomLabel position={[minX + 1.5, 0.02, midZ + 0.5]} text="HVAC PLANT ROOM" opacity={planOpacity} />
      <RoomLabel position={[maxX - 1.7, 0.02, midZ + 0.5]} text="COMPRESSOR ROOM" opacity={planOpacity} />
    </group>
  );
}

function rectPoints(x1, z1, x2, z2) {
  return [
    [x1, z1],
    [x2, z1],
    [x2, z2],
    [x1, z2],
    [x1, z1],
  ];
}

function RoomFloor({ x, z, w, d }) {
  return (
    <mesh position={[x, 0.012, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial color={COLORS.architecture} roughness={0.75} metalness={0.15} />
    </mesh>
  );
}

function FloorOutline({ points, opacity }) {
  const pts3 = points.map(([x, z]) => [x, 0.03, z]);
  return <Line points={pts3} color={COLORS.purpleGlow} transparent opacity={opacity} lineWidth={1} />;
}

function RoomLabel({ position, text, opacity }) {
  return (
    <Billboard position={position}>
      <Text fontSize={0.22} color={COLORS.textMuted} anchorX="center" anchorY="middle" fillOpacity={opacity} letterSpacing={0.05}>
        {text}
      </Text>
    </Billboard>
  );
}

function WallSeg({ x, z, w, d, h, opacity }) {
  return (
    <mesh position={[x, h / 2, z]}>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial
        color={COLORS.architecture}
        transparent
        opacity={opacity}
        roughness={0.5}
        metalness={0.15}
        depthWrite={false}
      />
    </mesh>
  );
}

// A wall running along one axis with a doorway gap in the middle.
function DoorWall({ axis, fixed, from, to, gapFrom, gapTo, thickness, height, opacity }) {
  if (axis === "x") {
    const leftLen = gapFrom - from;
    const rightLen = to - gapTo;
    return (
      <group>
        <WallSeg x={from + leftLen / 2} z={fixed} w={leftLen} d={thickness} h={height} opacity={opacity} />
        <WallSeg x={gapTo + rightLen / 2} z={fixed} w={rightLen} d={thickness} h={height} opacity={opacity} />
        {/* door header, subtle */}
        <mesh position={[(gapFrom + gapTo) / 2, height * 0.92, fixed]}>
          <boxGeometry args={[gapTo - gapFrom, height * 0.16, thickness]} />
          <meshStandardMaterial color={COLORS.architecture} transparent opacity={opacity} depthWrite={false} />
        </mesh>
      </group>
    );
  }
  return null;
}

function AccentBand({ x, z, w, d, y }) {
  const matRef = useRef();
  useFrame(() => {
    if (matRef.current) {
      const flicker = 0.5 + Math.sin(performance.now() * 0.0012 + x) * 0.15;
      matRef.current.emissiveIntensity = flicker;
    }
  });
  return (
    <mesh position={[x, y, z]}>
      <boxGeometry args={[w, 0.22, d * 0.94]} />
      <meshStandardMaterial
        ref={matRef}
        color={COLORS.windowLit}
        emissive={COLORS.windowLit}
        emissiveIntensity={0.5}
        transparent
        opacity={0.5}
        toneMapped={false}
      />
    </mesh>
  );
}

function Roof({ bounds, height, opacity }) {
  const { minX, maxX, minZ, maxZ } = bounds;
  const w = maxX - minX;
  const d = maxZ - minZ;
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;

  return (
    <group>
      <mesh position={[cx, height, cz]}>
        <boxGeometry args={[w, 0.14, d]} />
        <meshStandardMaterial color={COLORS.metalDark} transparent opacity={opacity} roughness={0.55} metalness={0.4} depthWrite={false} />
      </mesh>
      {/* parapet rim */}
      <mesh position={[cx, height + 0.14, minZ]}>
        <boxGeometry args={[w + 0.1, 0.16, 0.1]} />
        <meshStandardMaterial color={COLORS.metalDark} transparent opacity={opacity} roughness={0.5} metalness={0.5} depthWrite={false} />
      </mesh>
      <mesh position={[cx, height + 0.14, maxZ]}>
        <boxGeometry args={[w + 0.1, 0.16, 0.1]} />
        <meshStandardMaterial color={COLORS.metalDark} transparent opacity={opacity} roughness={0.5} metalness={0.5} depthWrite={false} />
      </mesh>
      <mesh position={[minX, height + 0.14, cz]}>
        <boxGeometry args={[0.1, 0.16, d + 0.1]} />
        <meshStandardMaterial color={COLORS.metalDark} transparent opacity={opacity} roughness={0.5} metalness={0.5} depthWrite={false} />
      </mesh>
      <mesh position={[maxX, height + 0.14, cz]}>
        <boxGeometry args={[0.1, 0.16, d + 0.1]} />
        <meshStandardMaterial color={COLORS.metalDark} transparent opacity={opacity} roughness={0.5} metalness={0.5} depthWrite={false} />
      </mesh>

      {/* rooftop HVAC units */}
      {[
        [cx - 3.2, cz - 0.5],
        [cx + 1.4, cz - 1.4],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, height + 0.32, z]}>
          <boxGeometry args={[1.1, 0.42, 0.75]} />
          <meshStandardMaterial color={COLORS.metalMid} transparent opacity={Math.max(opacity, 0.15)} roughness={0.45} metalness={0.55} depthWrite={false} />
        </mesh>
      ))}
      {/* rooftop vents */}
      {[-4.5, -1.5, 2.6, 4.8].map((x, i) => (
        <mesh key={i} position={[x, height + 0.24, cz + 2.2]}>
          <cylinderGeometry args={[0.13, 0.15, 0.2, 12]} />
          <meshStandardMaterial color={COLORS.metalDark} transparent opacity={Math.max(opacity, 0.15)} roughness={0.5} metalness={0.5} depthWrite={false} />
        </mesh>
      ))}
      {/* skylights above the baseload hall */}
      {[-2.2, 0, 2.2].map((x, i) => (
        <mesh key={i} position={[x, height + 0.08, minZ + 2.0]}>
          <boxGeometry args={[1.1, 0.05, 0.9]} />
          <meshStandardMaterial color={COLORS.windowLit} emissive={COLORS.windowLit} emissiveIntensity={0.35} transparent opacity={Math.max(opacity * 0.6, 0.12)} toneMapped={false} />
        </mesh>
      ))}
      {/* hazard lights */}
      {[
        [minX + 0.3, minZ + 0.3],
        [maxX - 0.3, maxZ - 0.3],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, height + 0.2, z]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color={COLORS.warnAmber} emissive={COLORS.warnAmber} emissiveIntensity={0.9} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function ElectricalRoom({ wallOpacity, roofOpacity }) {
  const [cx, cz] = ELECTRICAL_ROOM_POSITION.length === 3 ? [ELECTRICAL_ROOM_POSITION[0], ELECTRICAL_ROOM_POSITION[2]] : [0, 0];
  const [w, d] = ELECTRICAL_ROOM_SIZE;
  const minX = cx - w / 2;
  const maxX = cx + w / 2;
  const minZ = cz - d / 2;
  const maxZ = cz + d / 2;

  return (
    <group>
      <WallSeg x={minX} z={cz} w={0.1} d={d} h={ELEC_H} opacity={wallOpacity} />
      <WallSeg x={maxX} z={cz} w={0.1} d={d} h={ELEC_H} opacity={wallOpacity} />
      <WallSeg x={cx} z={minZ} w={w} d={0.1} h={ELEC_H} opacity={wallOpacity} />
      <DoorWall axis="x" fixed={maxZ} from={minX} to={maxX} gapFrom={cx - 0.9} gapTo={cx + 0.9} thickness={0.1} height={ELEC_H} opacity={wallOpacity} />

      <mesh position={[cx, ELEC_H, cz]}>
        <boxGeometry args={[w, 0.12, d]} />
        <meshStandardMaterial color={COLORS.metalDark} transparent opacity={roofOpacity} roughness={0.55} metalness={0.4} depthWrite={false} />
      </mesh>

      <RoomFloor x={cx} z={cz} w={w - 0.15} d={d - 0.15} />
      <FloorOutline points={rectPoints(minX, minZ, maxX, maxZ)} opacity={0.4} />
      <RoomLabel position={[cx, 0.02, cz]} text="ELECTRICAL ROOM" opacity={0.7} />

      {/* decorative switchgear/transformer greebles — atmosphere only */}
      <mesh position={[cx - 1.1, 0.5, cz - 0.4]}>
        <boxGeometry args={[0.6, 1.0, 0.5]} />
        <meshStandardMaterial color={COLORS.metalMid} roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh position={[cx + 1.1, 0.4, cz - 0.4]}>
        <boxGeometry args={[0.5, 0.8, 0.45]} />
        <meshStandardMaterial color={COLORS.metalMid} roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh position={[cx, 1.05, cz - 0.4]}>
        <boxGeometry args={[2.6, 0.06, 0.08]} />
        <meshStandardMaterial color={COLORS.purpleGlow} emissive={COLORS.purpleGlow} emissiveIntensity={0.5} toneMapped={false} />
      </mesh>
    </group>
  );
}
