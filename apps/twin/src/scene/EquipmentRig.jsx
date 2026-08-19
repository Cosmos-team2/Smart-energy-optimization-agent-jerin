import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// heightRef is a mutable ref (owned by EquipmentZone) holding the current
// smoothed load height, already lerping toward a target derived from real
// spike-data.json values. These rigs just read it each frame and shape
// themselves around it — no data of their own.
function glowPulse(spike) {
  return spike ? 0.55 + Math.sin(performance.now() * 0.008) * 0.3 : 0.2;
}

// tintColor is an optional presentation-only override (e.g. "pre-cooling"
// blue, "delayed" grey) driven by the rec_042 simulation state in Twin.jsx —
// it never affects the real value driving heightRef.
export default function EquipmentRig({ kind, color, heightRef, spike, tintColor }) {
  if (kind === "hvac") return <HvacUnit color={color} heightRef={heightRef} spike={spike} tintColor={tintColor} />;
  if (kind === "compressor")
    return <CompressorUnit color={color} heightRef={heightRef} spike={spike} tintColor={tintColor} />;
  return <BaseloadRack color={color} heightRef={heightRef} spike={spike} />;
}

function HvacUnit({ color, heightRef, spike, tintColor }) {
  const coreRef = useRef();
  const matRef = useRef();
  const fanGroupRef = useRef();
  const targetColor = useRef(new THREE.Color(color));

  useFrame((_, delta) => {
    const h = heightRef.current;
    if (coreRef.current) {
      coreRef.current.scale.y = h;
      coreRef.current.position.y = h / 2;
    }
    if (fanGroupRef.current) {
      fanGroupRef.current.position.y = h + 0.16;
      fanGroupRef.current.rotation.y += delta * (spike ? 6.5 : 2.2);
    }
    if (matRef.current) {
      matRef.current.emissiveIntensity = glowPulse(spike);
      targetColor.current.set(tintColor || color);
      matRef.current.color.lerp(targetColor.current, 0.08);
    }
  });

  return (
    <group>
      <mesh ref={coreRef} position={[0, 0.2, 0]}>
        <boxGeometry args={[1.2, 1, 1]} />
        <meshStandardMaterial ref={matRef} color={color} emissive={color} emissiveIntensity={0.2} />
      </mesh>

      {/* intake louvers — fixed near the housing base so they read at any height */}
      {[0.12, 0.22, 0.32].map((y, i) => (
        <mesh key={i} position={[0, y, 0.51]}>
          <boxGeometry args={[0.95, 0.035, 0.03]} />
          <meshStandardMaterial color="#0d1117" />
        </mesh>
      ))}

      {/* fan cap, spins faster during a spike */}
      <group ref={fanGroupRef}>
        <mesh>
          <cylinderGeometry args={[0.56, 0.56, 0.12, 20]} />
          <meshStandardMaterial color="#0d1117" />
        </mesh>
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[0.92, 0.05, 0.09]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0, 0.08, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[0.92, 0.05, 0.09]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
        </mesh>
      </group>
    </group>
  );
}

function CompressorUnit({ color, heightRef, spike, tintColor }) {
  const coreRef = useRef();
  const matRef = useRef();
  const capRef = useRef();
  const gaugeRef = useRef();
  const targetColor = useRef(new THREE.Color(color));

  useFrame(() => {
    const h = heightRef.current;
    if (coreRef.current) {
      coreRef.current.scale.y = h;
      coreRef.current.position.y = h / 2;
    }
    if (capRef.current) {
      capRef.current.position.y = h;
    }
    if (matRef.current) {
      matRef.current.emissiveIntensity = glowPulse(spike);
      targetColor.current.set(tintColor || color);
      matRef.current.color.lerp(targetColor.current, 0.08);
    }
    if (gaugeRef.current) {
      gaugeRef.current.emissiveIntensity = spike ? 1.3 + Math.sin(performance.now() * 0.02) * 0.5 : 0.6;
    }
  });

  return (
    <group>
      <mesh ref={coreRef} position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.48, 0.54, 1, 18]} />
        <meshStandardMaterial ref={matRef} color={color} emissive={color} emissiveIntensity={0.2} />
      </mesh>
      <mesh ref={capRef} position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.48, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
      </mesh>

      {/* side pipes — fixed near the base */}
      <mesh position={[0.56, 0.32, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.09, 0.09, 0.45, 10]} />
        <meshStandardMaterial color="#4a5568" />
      </mesh>
      <mesh position={[-0.56, 0.18, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.36, 10]} />
        <meshStandardMaterial color="#4a5568" />
      </mesh>

      {/* pressure gauge, brightens sharply on a spike */}
      <mesh position={[0, 0.42, 0.5]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial ref={gaugeRef} color="#ff4d4f" emissive="#ff4d4f" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

function BaseloadRack({ color, heightRef, spike }) {
  const coreRefs = [useRef(), useRef(), useRef()];
  const matRefs = [useRef(), useRef(), useRef()];
  const ledRefs = [useRef(), useRef(), useRef()];
  const xOffsets = [-0.4, 0, 0.4];

  useFrame(() => {
    const h = heightRef.current;
    const pulse = glowPulse(spike);
    for (let i = 0; i < 3; i++) {
      if (coreRefs[i].current) {
        coreRefs[i].current.scale.y = h;
        coreRefs[i].current.position.y = h / 2;
      }
      if (matRefs[i].current) matRefs[i].current.emissiveIntensity = pulse;
      if (ledRefs[i].current) ledRefs[i].current.position.y = Math.min(h, 0.3) + 0.15;
    }
  });

  return (
    <group>
      {xOffsets.map((x, i) => (
        <group key={i}>
          <mesh ref={coreRefs[i]} position={[x, 0.2, 0]}>
            <boxGeometry args={[0.32, 1, 0.58]} />
            <meshStandardMaterial ref={matRefs[i]} color={color} emissive={color} emissiveIntensity={0.2} />
          </mesh>
          <mesh ref={ledRefs[i]} position={[x, 0.45, 0.3]}>
            <boxGeometry args={[0.09, 0.05, 0.02]} />
            <meshStandardMaterial color="#8be9a3" emissive="#8be9a3" emissiveIntensity={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
