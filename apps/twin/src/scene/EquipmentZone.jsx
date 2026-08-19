import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Text, Html } from "@react-three/drei";
import * as THREE from "three";

import EquipmentRig from "./EquipmentRig.jsx";
import { COLORS } from "../palette.js";

const MAX_HEIGHT = 2.2;
const BASE_HEIGHT = 0.4;

function heightForRatio(ratio) {
  return BASE_HEIGHT + Math.min(1, ratio) * MAX_HEIGHT;
}

// value/ratio are derived directly from spike-data.json's timeline (real
// base_kw / hvac_kw / comp_kw readings). spike flags come from that same
// data's is_spike_event field for the two zones rec_042 targets.
//
// ghostRatio (optional) draws a translucent red outline at the BASELINE
// height behind the current block — only passed in Optimized mode at the
// spike slot, to make the reduction visible in the model itself, not just
// in text. statusBadge (optional) labels a rec_042 action currently in
// effect (pre-cooling / soft ramp / delayed restart). dimmed (bool) is true
// when a *different* zone is selected — fades this zone's glow so the
// selection reads clearly. onSelect(zoneId|null) toggles selection.
export default function EquipmentZone({ zone, value, ratio, spike, ghostRatio, ghostValue, statusBadge, tintColor, selected, dimmed, onSelect }) {
  const heightRef = useRef(0.4);
  const haloRef = useRef();
  const haloMatRef = useRef();
  const outlineRef = useRef();
  const focusRef = useRef(1);
  const [hovered, setHovered] = useState(false);

  const targetHeight = heightForRatio(ratio);
  const ghostHeight = ghostRatio != null ? heightForRatio(ghostRatio) : null;
  const statusLabel = spike ? "SPIKE" : ratio > 0.55 ? "ACTIVE" : "NORMAL";
  const statusDotColor = spike ? COLORS.warnRed : ratio > 0.55 ? COLORS.energyCyan : COLORS.purpleGlow;

  useFrame((_, delta) => {
    heightRef.current = THREE.MathUtils.lerp(heightRef.current, targetHeight, Math.min(1, delta * 4));

    if (haloRef.current && haloMatRef.current) {
      if (spike) {
        const t = (performance.now() * 0.0012) % 1;
        haloRef.current.scale.setScalar(1 + t * 0.9);
        haloMatRef.current.opacity = 0.5 * (1 - t);
      } else {
        haloMatRef.current.opacity = 0;
      }
    }
    if (outlineRef.current) {
      const target = hovered || selected ? 0.85 : 0;
      outlineRef.current.material.opacity = THREE.MathUtils.lerp(outlineRef.current.material.opacity, target, 0.15);
    }
    focusRef.current = THREE.MathUtils.lerp(focusRef.current, dimmed ? 0.3 : 1, 0.08);
  });

  return (
    <group
      position={zone.position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(selected ? null : zone.id);
      }}
    >
      {/* zone floor pad — dark graphite, subtle purple/cyan accent ring */}
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <cylinderGeometry args={[1.65, 1.65, 0.06, 32]} />
        <meshStandardMaterial color={COLORS.graphite} roughness={0.7} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.065, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.55, 1.64, 32]} />
        <meshBasicMaterial color={zone.color} transparent opacity={0.4} />
      </mesh>
      {/* subtle outer zone boundary */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.95, 2.0, 40]} />
        <meshBasicMaterial color={zone.color} transparent opacity={0.14} />
      </mesh>
      {/* hover/selection outline — premium purple/cyan halo, not a giant card */}
      <mesh ref={outlineRef} position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.68, 1.74, 40]} />
        <meshBasicMaterial color={COLORS.purpleGlow} transparent opacity={0} toneMapped={false} />
      </mesh>
      {/* pulsing "ping" halo shown only while this zone is spiking */}
      <mesh ref={haloRef} position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.7, 1.85, 40]} />
        <meshBasicMaterial ref={haloMatRef} color={COLORS.warnRed} transparent opacity={0} />
      </mesh>

      <EquipmentRig kind={zone.kind} accentColor={zone.color} heightRef={heightRef} spike={spike} tintColor={tintColor} focusRef={focusRef} />

      {/* Ghost outline: "this is how tall baseline would be right now" */}
      {ghostHeight != null && (
        <mesh position={[0, ghostHeight / 2, 0]}>
          <boxGeometry args={[1.4, ghostHeight, 1.4]} />
          <meshBasicMaterial color={COLORS.warnRed} wireframe transparent opacity={0.45} />
        </mesh>
      )}

      {/* Fixed-height nameplate stack, clear of the tallest possible block
          (maxHeight above) so it never collides with the value/spike text. */}
      <Billboard position={[0, 4.35, 0]}>
        <Text fontSize={0.32} color={COLORS.white} anchorX="center" anchorY="middle">
          {zone.label}
        </Text>
      </Billboard>
      <Billboard position={[0, 4.02, 0]}>
        <Text fontSize={0.19} color={COLORS.textMuted} anchorX="center" anchorY="middle">
          {zone.id}
        </Text>
      </Billboard>
      <Billboard position={[0, 3.6, 0]}>
        <Text fontSize={0.3} color={zone.color} anchorX="center" anchorY="middle">
          {`${value.toFixed(1)} kW`}
        </Text>
      </Billboard>
      {spike && (
        <Billboard position={[0, 3.22, 0]}>
          <Text fontSize={0.28} color={COLORS.warnRed} anchorX="center" anchorY="middle" outlineWidth={0.012} outlineColor="#3d0d0e">
            {"⚠ SPIKE"}
          </Text>
        </Billboard>
      )}
      {!spike && statusBadge && (
        <Billboard position={[0, 3.22, 0]}>
          <Text fontSize={0.22} color={statusBadge.color} anchorX="center" anchorY="middle">
            {statusBadge.text}
          </Text>
        </Billboard>
      )}
      {ghostHeight != null && (
        <Billboard position={[0, 2.95, 0]}>
          <Text fontSize={0.17} color="#ff8a8a" anchorX="center" anchorY="middle">
            {`baseline was ${ghostValue.toFixed(1)} kW`}
          </Text>
        </Billboard>
      )}

      {/* premium hover telemetry — small floating label, not a giant card */}
      {hovered && !selected && (
        <Html position={[0, 1.35, 0]} center distanceFactor={9} style={{ pointerEvents: "none" }}>
          <div
            style={{
              background: "rgba(16,12,26,0.88)",
              border: `1px solid ${COLORS.purpleTrace}`,
              borderRadius: 6,
              padding: "5px 9px",
              fontFamily: "'Segoe UI', system-ui, sans-serif",
              fontSize: 11,
              color: COLORS.white,
              whiteSpace: "nowrap",
              boxShadow: "0 4px 18px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ fontWeight: 600, letterSpacing: 0.3 }}>{zone.label.toUpperCase()}</div>
            <div style={{ opacity: 0.85 }}>{`${value.toFixed(1)} kW`}</div>
            <div style={{ color: statusDotColor, fontSize: 10, marginTop: 1 }}>{`● ${statusLabel}`}</div>
          </div>
        </Html>
      )}
    </group>
  );
}
