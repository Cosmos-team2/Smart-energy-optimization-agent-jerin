import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { COLORS } from "../palette.js";
import { Louvers, FanBlades, Gauge, PipeRun, StatusLight } from "./Parts.jsx";

// heightRef is a mutable ref (owned by EquipmentZone) holding the current
// smoothed load height, already lerping toward a target derived from real
// spike-data.json values. These rigs just read it each frame and shape
// themselves around it — no data of their own. The core housing still
// squashes/grows with heightRef (preserves the existing load-driven height
// signal + the ghost-comparison overlay in EquipmentZone, which reads the
// same height math); everything else is fixed geometry that tracks the
// core's top/base so it never floats or clips as height changes.
function glowPulse(spike, focus = 1) {
  return (spike ? 0.65 + Math.sin(performance.now() * 0.008) * 0.35 : 0.28) * focus;
}

// accentColor is the STATE color (purple/cyan normal, red on spike) — never
// the zone's identity color. tintColor is an optional presentation-only
// rec_042 badge override (e.g. "pre-cooling" blue, "delayed" grey) driven by
// the simulation state in DigitalTwinPage.jsx. focusRef (optional) is a
// mutable 0..1 ref owned by EquipmentZone — dims a zone's glow when a
// different zone is selected, without any re-render cost.
export default function EquipmentRig({ kind, accentColor, heightRef, spike, tintColor, focusRef }) {
  if (kind === "hvac")
    return <HvacUnit accentColor={accentColor} heightRef={heightRef} spike={spike} tintColor={tintColor} focusRef={focusRef} />;
  if (kind === "compressor")
    return <CompressorUnit accentColor={accentColor} heightRef={heightRef} spike={spike} tintColor={tintColor} focusRef={focusRef} />;
  return <BaseloadRack accentColor={accentColor} heightRef={heightRef} spike={spike} focusRef={focusRef} />;
}

function HvacUnit({ accentColor, heightRef, spike, tintColor, focusRef }) {
  const coreRef = useRef();
  const glowMatRef = useRef();
  const fanGroupRef = useRef();
  const spinRef = useRef(1.4);
  const ledRef = useRef(0.6);
  const targetColor = useRef(new THREE.Color(accentColor));

  useFrame((_, delta) => {
    const h = heightRef.current;
    if (coreRef.current) {
      coreRef.current.scale.y = h;
      coreRef.current.position.y = h / 2;
    }
    if (fanGroupRef.current) {
      fanGroupRef.current.position.y = h + 0.2;
    }
    spinRef.current = spike ? 7 : 2.4;
    const pulse = glowPulse(spike, focusRef?.current ?? 1);
    if (glowMatRef.current) {
      targetColor.current.set(tintColor || accentColor);
      glowMatRef.current.color.lerp(targetColor.current, 0.08);
      glowMatRef.current.emissive.lerp(targetColor.current, 0.08);
      glowMatRef.current.emissiveIntensity = pulse;
    }
    ledRef.current = pulse;
  });

  return (
    <group>
      {/* main chiller housing — dark graphite, brushed metal trim */}
      <group ref={coreRef} position={[0, 0.2, 0]}>
        <RoundedBox args={[1.3, 1, 1.05]} radius={0.05} smoothness={2}>
          <meshStandardMaterial color={COLORS.metalMid} roughness={0.5} metalness={0.5} />
        </RoundedBox>
        {/* trim band, glows with load/spike */}
        <mesh position={[0, 0, 0.54]}>
          <boxGeometry args={[1.1, 0.14, 0.02]} />
          <meshStandardMaterial ref={glowMatRef} color={accentColor} emissive={accentColor} emissiveIntensity={0.3} toneMapped={false} />
        </mesh>
        <group position={[0, -0.15, 0.531]} scale={[1, 1, 1]}>
          <Louvers count={5} width={1.0} height={0.5} color={COLORS.metalDark} />
        </group>
        {/* small control panel */}
        <group position={[0.72, 0, 0.53]}>
          <mesh>
            <boxGeometry args={[0.16, 0.22, 0.02]} />
            <meshStandardMaterial color={COLORS.metalDark} roughness={0.6} metalness={0.4} />
          </mesh>
          <group position={[0, 0, 0.012]}>
            <Gauge radius={0.055} glowRef={ledRef} color={accentColor} />
          </group>
        </group>
        <StatusLight position={[-0.72, 0.1, 0.53]} color={accentColor} glowRef={ledRef} size={0.035} />
      </group>

      {/* base skid */}
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[1.4, 0.06, 1.15]} />
        <meshStandardMaterial color={COLORS.metalDark} roughness={0.5} metalness={0.6} />
      </mesh>

      {/* rooftop fan housings — spin faster during a spike */}
      <group ref={fanGroupRef}>
        {[-0.32, 0.32].map((x, i) => (
          <group key={i} position={[x, 0, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.32, 0.32, 0.14, 20]} />
              <meshStandardMaterial color={COLORS.metalMid} roughness={0.4} metalness={0.6} />
            </mesh>
            <group position={[0, 0.075, 0]}>
              <FanBlades radius={0.24} color={COLORS.metalLight} spinRef={spinRef} />
            </group>
          </group>
        ))}
      </group>

      {/* pipe connections at the base, fixed regardless of housing height */}
      <PipeRun from={[0.58, 0.22, 0]} to={[0.9, 0.22, -0.4]} radius={0.045} color={COLORS.metalLight} />
      <PipeRun from={[-0.58, 0.14, 0]} to={[-0.9, 0.14, -0.4]} radius={0.04} color={COLORS.metalLight} />

      {/* exhaust duct + vent cap, distinct from the intake louvers on the front face */}
      <mesh position={[0, 0.65, -0.56]}>
        <boxGeometry args={[0.3, 0.5, 0.14]} />
        <meshStandardMaterial color={COLORS.metalDark} roughness={0.55} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.92, -0.56]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.1, 14]} />
        <meshStandardMaterial color={COLORS.metalMid} roughness={0.5} metalness={0.55} />
      </mesh>
    </group>
  );
}

function CompressorUnit({ accentColor, heightRef, spike, tintColor, focusRef }) {
  const coreRef = useRef();
  const matRef = useRef();
  const capRef = useRef();
  const gaugeGlowRef = useRef(0.5);
  const targetColor = useRef(new THREE.Color(accentColor));

  useFrame(() => {
    const h = heightRef.current;
    if (coreRef.current) {
      coreRef.current.scale.y = h;
      coreRef.current.position.y = h / 2;
    }
    if (capRef.current) capRef.current.position.y = h;
    const focus = focusRef?.current ?? 1;
    const pulse = glowPulse(spike, focus);
    if (matRef.current) {
      targetColor.current.set(tintColor || accentColor);
      matRef.current.emissive.lerp(targetColor.current, 0.08);
      matRef.current.emissiveIntensity = pulse * 0.5;
    }
    // gauge reacts subtly to load, sharper on spike
    gaugeGlowRef.current = (spike ? 1.1 + Math.sin(performance.now() * 0.02) * 0.4 : 0.35 + Math.min(1, h / 1.8) * 0.35) * focus;
  });

  return (
    <group>
      {/* pressure vessel — dark brushed metal cylinder */}
      <mesh ref={coreRef} position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.46, 0.5, 1, 20]} />
        <meshStandardMaterial ref={matRef} color={COLORS.metalMid} roughness={0.4} metalness={0.7} emissive={accentColor} emissiveIntensity={0.15} />
      </mesh>
      <mesh ref={capRef} position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.46, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={COLORS.metalMid} roughness={0.4} metalness={0.7} />
      </mesh>

      {/* motor housing beside the vessel, fixed */}
      <mesh position={[-0.78, 0.22, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.5, 16]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color={COLORS.metalMid} roughness={0.5} metalness={0.55} />
      </mesh>

      {/* mounting frame */}
      {[-0.55, 0.55].map((x, i) => (
        <mesh key={i} position={[x, 0.04, 0]}>
          <boxGeometry args={[0.08, 0.08, 1.1]} />
          <meshStandardMaterial color={COLORS.metalDark} roughness={0.5} metalness={0.6} />
        </mesh>
      ))}

      {/* inlet/outlet pipes — fixed near the base */}
      <PipeRun from={[0.5, 0.32, 0]} to={[0.95, 0.32, 0]} radius={0.075} color={COLORS.metalLight} />
      <PipeRun from={[-0.5, 0.18, 0]} to={[-0.95, 0.18, 0.35]} radius={0.065} color={COLORS.metalLight} />

      {/* pressure gauge — subtle load-reactive glow, sharp on spike */}
      <group position={[0, 0.42, 0.47]} rotation={[Math.PI / 2, 0, 0]}>
        <Gauge radius={0.11} glowRef={gaugeGlowRef} color={spike ? COLORS.warnRed : accentColor} />
      </group>
      <StatusLight position={[0.3, 0.72, 0.3]} color={accentColor} glowRef={gaugeGlowRef} size={0.032} />
    </group>
  );
}

function BaseloadRack({ accentColor, heightRef, spike, focusRef }) {
  const coreRefs = [useRef(), useRef(), useRef()];
  const matRefs = [useRef(), useRef(), useRef()];
  const ledRef = useRef(0.6);
  const xOffsets = [-0.42, 0, 0.42];

  useFrame(() => {
    const h = heightRef.current;
    const focus = focusRef?.current ?? 1;
    const pulse = glowPulse(spike, focus);
    ledRef.current = pulse;
    for (let i = 0; i < 3; i++) {
      if (coreRefs[i].current) {
        coreRefs[i].current.scale.y = h;
        coreRefs[i].current.position.y = h / 2;
      }
      if (matRefs[i].current) matRefs[i].current.emissiveIntensity = (0.25 + pulse * 0.4) * focus;
    }
  });

  return (
    <group>
      {/* cable tray tying the cabinet row together, fixed above tallest housing */}
      <mesh position={[0, 2.35, 0]}>
        <boxGeometry args={[1.3, 0.06, 0.14]} />
        <meshStandardMaterial color={COLORS.metalDark} roughness={0.5} metalness={0.6} />
      </mesh>
      {[-0.55, -0.18, 0.18, 0.55].map((x, i) => (
        <mesh key={i} position={[x, 2.35, 0]}>
          <boxGeometry args={[0.02, 0.08, 0.16]} />
          <meshStandardMaterial color={COLORS.metalDark} roughness={0.5} metalness={0.6} />
        </mesh>
      ))}
      {/* conduit riser feeding the tray down into the floor at one end */}
      <PipeRun from={[-0.7, 2.35, 0]} to={[-0.7, 0.05, 0]} radius={0.035} color={COLORS.metalLight} />

      {xOffsets.map((x, i) => (
        <group key={i}>
          <mesh ref={coreRefs[i]} position={[x, 0.2, 0]}>
            <boxGeometry args={[0.34, 1, 0.6]} />
            <meshStandardMaterial ref={matRefs[i]} color={COLORS.metalMid} emissive={accentColor} emissiveIntensity={0.3} roughness={0.5} metalness={0.5} />
          </mesh>
          {/* door seam */}
          <mesh position={[x, 0.2, 0.301]}>
            <boxGeometry args={[0.02, 0.9, 0.01]} />
            <meshStandardMaterial color={COLORS.metalDark} />
          </mesh>
          <group position={[x, 0.15, 0.305]} rotation={[0, 0, 0]}>
            <group scale={[0.85, 0.85, 1]}>
              <Louvers count={4} width={0.24} height={0.28} color={COLORS.metalDark} />
            </group>
          </group>
          <StatusLight position={[x, 0.55, 0.31]} color={accentColor} glowRef={ledRef} size={0.03} />
          {/* base skid */}
          <mesh position={[x, 0.02, 0]}>
            <boxGeometry args={[0.38, 0.04, 0.64]} />
            <meshStandardMaterial color={COLORS.metalDark} roughness={0.5} metalness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
