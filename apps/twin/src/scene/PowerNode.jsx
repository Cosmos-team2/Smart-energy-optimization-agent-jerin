import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";

// loadRatio = current total_kw / contract limit kW (real values, computed in Twin.jsx)
export default function PowerNode({ position, loadRatio }) {
  const lightRef = useRef();
  const glowRef = useRef();

  const glowColor = loadRatio >= 1 ? "#ff4d4f" : loadRatio >= 0.75 ? "#faad14" : "#3ddc84";

  useFrame(() => {
    if (lightRef.current) {
      lightRef.current.intensity = 2 + loadRatio * 5;
    }
    if (glowRef.current) {
      const pulse = 0.6 + Math.sin(performance.now() * 0.004) * 0.2;
      glowRef.current.emissiveIntensity = pulse + loadRatio * 0.6;
    }
  });

  return (
    <group position={position}>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[1.1, 1.3, 0.1, 24]} />
        <meshStandardMaterial color="#1a212c" />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.15, 0.18, 3, 12]} />
        <meshStandardMaterial color="#4a5568" />
      </mesh>
      <mesh position={[0, 3.1, 0]}>
        <sphereGeometry args={[0.42, 20, 20]} />
        <meshStandardMaterial
          ref={glowRef}
          color={glowColor}
          emissive={glowColor}
          emissiveIntensity={0.8}
        />
      </mesh>
      <pointLight ref={lightRef} position={[0, 3.1, 0]} color={glowColor} distance={14} />

      <Billboard position={[0, 4.1, 0]}>
        <Text fontSize={0.34} color="#e6edf3" anchorX="center" anchorY="bottom">
          GRID SOURCE
        </Text>
      </Billboard>
    </group>
  );
}
