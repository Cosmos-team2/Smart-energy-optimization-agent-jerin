import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import { COLORS } from "../palette.js";
import { PipeRun, StatusLight } from "./Parts.jsx";

// loadRatio = current total_kw / contract limit kW (real values, computed in
// DigitalTwinPage.jsx). Stylized grid substation/transformer — the point
// where grid power visually enters the facility. glowColor communicates
// STATE only (purple/cyan healthy, amber near-limit, red over-limit), never
// equipment identity.
export default function PowerNode({ position, loadRatio }) {
  const lightRef = useRef();
  const glowRef = useRef();
  const ledGlowRef = useRef(0.7);

  const glowColor = loadRatio >= 1 ? COLORS.warnRed : loadRatio >= 0.75 ? COLORS.warnAmber : COLORS.energyCyan;

  useFrame(() => {
    if (lightRef.current) {
      lightRef.current.intensity = 2.2 + loadRatio * 5;
      lightRef.current.color.set(glowColor);
    }
    if (glowRef.current) {
      const pulse = 0.6 + Math.sin(performance.now() * 0.004) * 0.2;
      glowRef.current.emissiveIntensity = pulse + loadRatio * 0.6;
      glowRef.current.color.set(glowColor);
      glowRef.current.emissive.set(glowColor);
    }
    ledGlowRef.current = 0.5 + loadRatio * 0.6;
  });

  return (
    <group position={position}>
      {/* pad */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[1.2, 1.4, 0.1, 24]} />
        <meshStandardMaterial color={COLORS.graphite} roughness={0.7} metalness={0.3} />
      </mesh>

      {/* transformer body — dark brushed metal */}
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[1.05, 0.9, 0.7]} />
        <meshStandardMaterial color={COLORS.metalMid} roughness={0.4} metalness={0.65} />
      </mesh>
      {/* radiator fins on both sides */}
      {[-0.58, 0.58].map((x, gi) => (
        <group key={gi} position={[x, 0.55, 0]}>
          {[-0.24, -0.08, 0.08, 0.24].map((z, i) => (
            <mesh key={i} position={[0, 0, z]}>
              <boxGeometry args={[0.06, 0.75, 0.06]} />
              <meshStandardMaterial color={COLORS.metalDark} roughness={0.45} metalness={0.6} />
            </mesh>
          ))}
        </group>
      ))}

      {/* bushing insulators on top, feeding the grid connection */}
      {[-0.28, 0, 0.28].map((x, i) => (
        <group key={i} position={[x, 1.02, 0]}>
          {[0, 1, 2].map((j) => (
            <mesh key={j} position={[0, 0.06 * j, 0]}>
              <cylinderGeometry args={[0.05 - j * 0.004, 0.06 - j * 0.004, 0.07, 10]} />
              <meshStandardMaterial color={COLORS.metalWarm} roughness={0.5} metalness={0.3} />
            </mesh>
          ))}
          <StatusLight position={[0, 0.24, 0]} color={glowColor} glowRef={ledGlowRef} size={0.028} />
        </group>
      ))}

      {/* grid connection pylon behind the transformer */}
      <mesh position={[0, 1.6, -0.55]}>
        <cylinderGeometry args={[0.07, 0.09, 2.2, 10]} />
        <meshStandardMaterial color={COLORS.metalDark} roughness={0.5} metalness={0.6} />
      </mesh>
      <mesh position={[0, 2.65, -0.55]}>
        <boxGeometry args={[0.7, 0.05, 0.05]} />
        <meshStandardMaterial color={COLORS.metalDark} roughness={0.5} metalness={0.6} />
      </mesh>

      {/* the "energy source" glow — grid power visibly feeds in from here */}
      <mesh position={[0, 1.35, 0]}>
        <sphereGeometry args={[0.22, 18, 18]} />
        <meshStandardMaterial ref={glowRef} color={glowColor} emissive={glowColor} emissiveIntensity={0.8} toneMapped={false} />
      </mesh>
      <pointLight ref={lightRef} position={[0, 1.35, 0]} color={glowColor} distance={13} />

      {/* connecting cables down to the pad, subtle sag */}
      <PipeRun from={[-0.15, 2.6, -0.55]} to={[-0.15, 1.05, -0.05]} radius={0.02} color={COLORS.metalDark} />
      <PipeRun from={[0.15, 2.6, -0.55]} to={[0.15, 1.05, -0.05]} radius={0.02} color={COLORS.metalDark} />

      <Billboard position={[0, 2.05, 0]}>
        <Text fontSize={0.28} color={COLORS.white} anchorX="center" anchorY="bottom">
          GRID SUBSTATION
        </Text>
      </Billboard>
    </group>
  );
}
