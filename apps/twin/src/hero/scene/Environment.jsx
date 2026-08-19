import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Grid } from "@react-three/drei";
import * as THREE from "three";
import { COLORS } from "../palette.js";
import { LAYOUT } from "./layout.js";

// ─── Pad / service concrete ───────────────────────────────────────────────
function Pad({ position, radius = 1.3 }) {
  return (
    <mesh position={position} receiveShadow>
      <cylinderGeometry args={[radius, radius, 0.08, 28]} />
      <meshStandardMaterial color={COLORS.concreteLight} roughness={0.9} />
    </mesh>
  );
}

// ─── Pole light ───────────────────────────────────────────────────────────
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
        <meshStandardMaterial
          color={COLORS.warnAmber}
          emissive={COLORS.warnAmber}
          emissiveIntensity={0.55}
          toneMapped={false}
        />
      </mesh>
      <pointLight position={[0, 2.05, 0]} color={COLORS.warnAmber} intensity={1.1} distance={6} decay={2} />
    </group>
  );
}

// ─── Distant transmission tower (simplified silhouette) ────────────────────
function TransmissionTower({ position }) {
  const col = COLORS.metalDark;
  return (
    <group position={position} scale={0.55}>
      {/* Main mast */}
      <mesh position={[0, 4.5, 0]}>
        <cylinderGeometry args={[0.07, 0.14, 9, 6]} />
        <meshStandardMaterial color={col} roughness={0.8} metalness={0.5} />
      </mesh>
      {/* Cross arms */}
      {[3.5, 5.5, 7.5].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.035, 0.035, 3 - i * 0.4, 6]} />
          <meshStandardMaterial color={col} roughness={0.8} metalness={0.5} />
        </mesh>
      ))}
      {/* Insulator dots */}
      {[-1, 0, 1].map((x, i) => (
        <mesh key={i} position={[x * 1.2, 5.8, 0]}>
          <sphereGeometry args={[0.07, 6, 6]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.5} />
        </mesh>
      ))}
      {/* Subtle glow at top */}
      <mesh position={[0, 9, 0]}>
        <sphereGeometry args={[0.06, 6, 6]} />
        <meshStandardMaterial
          color={COLORS.purple}
          emissive={COLORS.purple}
          emissiveIntensity={0.6}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

// ─── Sparse background data particles ────────────────────────────────────
function BackgroundParticles() {
  const count = 80;
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const positions = useMemo(() => {
    const pos = [];
    for (let i = 0; i < count; i++) {
      pos.push({
        x: (Math.random() - 0.5) * 60,
        y: Math.random() * 8 + 0.3,
        z: (Math.random() - 0.5) * 60,
        speed: Math.random() * 0.3 + 0.05,
        phase: Math.random() * Math.PI * 2,
        amp: Math.random() * 0.3 + 0.05,
      });
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    positions.forEach((p, i) => {
      dummy.position.set(p.x, p.y + Math.sin(t * p.speed + p.phase) * p.amp, p.z);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <sphereGeometry args={[0.04, 5, 5]} />
      <meshBasicMaterial color={COLORS.purple} transparent opacity={0.25} toneMapped={false} />
    </instancedMesh>
  );
}

// ─── Atmospheric purple glow plane ─────────────────────────────────────────
function AtmosphericHaze() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
      <planeGeometry args={[80, 80]} />
      <meshBasicMaterial
        color={COLORS.purpleDim}
        transparent
        opacity={0.04}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

// ─── Small tree (cone + trunk) ────────────────────────────────────────────
function Tree({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.07, 0.1, 0.7, 7]} />
        <meshStandardMaterial color="#181c14" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <coneGeometry args={[0.4, 1.4, 8]} />
        <meshStandardMaterial color="#0f1a10" roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.7, 0]}>
        <coneGeometry args={[0.28, 0.9, 8]} />
        <meshStandardMaterial color="#111d12" roughness={0.95} />
      </mesh>
    </group>
  );
}

// ─── Assembled environment ─────────────────────────────────────────────────
export default function Environment() {
  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color={COLORS.bg} roughness={1} />
      </mesh>

      {/* Technical grid */}
      <Grid
        args={[100, 100]}
        cellSize={1.5}
        cellThickness={0.35}
        cellColor="#141428"
        sectionSize={7.5}
        sectionThickness={0.7}
        sectionColor="#1e1e40"
        fadeDistance={48}
        fadeStrength={1.6}
        infiniteGrid={false}
        position={[0, -0.015, 0]}
      />

      {/* Atmospheric purple haze */}
      <AtmosphericHaze />

      {/* Service road ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1, 0.005, -0.5]}>
        <ringGeometry args={[9.2, 10.4, 64, 1, Math.PI * 0.15, Math.PI * 1.5]} />
        <meshStandardMaterial color="#0c0e18" roughness={0.95} />
      </mesh>

      {/* Equipment pads */}
      <Pad position={LAYOUT.compressor} radius={1.1} />
      <Pad position={LAYOUT.airReceiver} radius={0.7} />
      <Pad position={LAYOUT.transformer} radius={1.4} />
      <Pad position={LAYOUT.substation} radius={1.6} />
      <Pad position={LAYOUT.gridMast} radius={1.2} />

      {/* Distant transmission towers */}
      <TransmissionTower position={[-24, 0, -18]} />
      <TransmissionTower position={[-32, 0, -8]} />
      <TransmissionTower position={[-20, 0, -28]} />

      {/* Sparse trees */}
      <Tree position={[18, 0, 6]} />
      <Tree position={[20, 0, -4]} />
      <Tree position={[16, 0, -10]} />
      <Tree position={[-6, 0, 12]} />
      <Tree position={[2, 0, 14]} />
      <Tree position={[-4, 0, -14]} />

      {/* Perimeter pole lights */}
      <PoleLight position={[6.5, 0, -6]} />
      <PoleLight position={[-6.5, 0, 5.5]} />
      <PoleLight position={[13, 0, 0]} />
      <PoleLight position={[-2, 0, -12]} />

      {/* Sparse floating data particles */}
      <BackgroundParticles />
    </group>
  );
}
