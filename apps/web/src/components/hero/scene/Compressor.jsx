import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { COLORS } from "../palette.js";
import { Gauge, Bolt } from "./Parts.jsx";

// Tank-mounted industrial air compressor: horizontal receiver base, motor
// housing, compressor head, belt guard, and a live pressure gauge whose
// needle sweeps with glowRef (real comp_kw-driven story state).
export default function Compressor({ glowRef, color = COLORS.energyCyan }) {
  const needleRef = useRef();
  const gaugeGlow = useRef(0.4);

  useFrame(() => {
    const g = glowRef?.current ?? 0.35;
    gaugeGlow.current = g;
    if (needleRef.current) {
      const target = -0.9 + Math.min(1, g * 1.6) * 1.8;
      needleRef.current.rotation.z += (target - needleRef.current.rotation.z) * 0.08;
    }
  });

  return (
    <group>
      {/* horizontal tank base */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 1.7, 20]} />
        <meshStandardMaterial color={COLORS.metalLight} roughness={0.4} metalness={0.6} />
      </mesh>
      {[-0.85, 0.85].map((x, i) => (
        <mesh key={i} position={[x, 0.42, 0]} rotation={[0, 0, Math.PI / 2]}>
          <sphereGeometry args={[0.4, 20, 20]} />
          <meshStandardMaterial color={COLORS.metalLight} roughness={0.4} metalness={0.6} />
        </mesh>
      ))}
      {[[-0.45, 0.02], [0.45, 0.02]].map((p, i) => (
        <mesh key={i} position={[p[0], 0.02, 0]}>
          <boxGeometry args={[0.12, 0.06, 0.5]} />
          <meshStandardMaterial color={COLORS.metalDark} roughness={0.7} />
        </mesh>
      ))}

      {/* motor housing */}
      <mesh position={[-0.55, 0.95, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.55, 16]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color={COLORS.metalMid} roughness={0.5} metalness={0.5} />
      </mesh>

      {/* compressor head / cylinder block */}
      <mesh position={[0.35, 1.0, 0]}>
        <boxGeometry args={[0.42, 0.36, 0.34]} />
        <meshStandardMaterial color={COLORS.metalDark} roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh position={[0.35, 1.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.3, 10]} />
        <meshStandardMaterial color={COLORS.metalLight} roughness={0.4} metalness={0.6} />
      </mesh>

      {/* belt guard */}
      <mesh position={[-0.08, 0.95, 0.2]}>
        <boxGeometry args={[0.7, 0.2, 0.06]} />
        <meshStandardMaterial color={COLORS.metalDark} roughness={0.6} metalness={0.4} />
      </mesh>

      {/* gauge + needle */}
      <group position={[0.35, 1.2, 0.18]}>
        <Gauge radius={0.09} glowRef={gaugeGlow} color={color} />
        <mesh ref={needleRef} position={[0, 0, 0.014]}>
          <boxGeometry args={[0.07, 0.01, 0.005]} />
          <meshStandardMaterial color="#0a0d10" />
        </mesh>
      </group>

      {[[-0.9, 0.05, 0.32], [0.9, 0.05, 0.32], [-0.9, 0.05, -0.32], [0.9, 0.05, -0.32]].map((p, i) => (
        <group key={i} position={p}>
          <Bolt radius={0.035} />
        </group>
      ))}
    </group>
  );
}
