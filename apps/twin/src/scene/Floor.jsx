import { Grid } from "@react-three/drei";

export default function Floor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[44, 44]} />
        <meshStandardMaterial color="#11151d" />
      </mesh>
      <Grid
        position={[0, 0, 0]}
        args={[44, 44]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#232b38"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#3a4a5f"
        fadeDistance={28}
        fadeStrength={1.5}
        infiniteGrid={false}
      />
    </group>
  );
}
