import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { COLORS } from "../palette.js";

const tmpScale = new THREE.Vector3();

// Wraps a piece of equipment geometry with hover highlight, a click-select
// ring, and an HTML tooltip anchored in 3D space. Equipment components
// themselves are drawn at their own local origin; Hotspot owns placement.
export default function Hotspot({
  id,
  position,
  ringRadius = 1.2,
  label,
  load,
  status,
  hovered,
  active,
  onHover,
  onSelect,
  children,
}) {
  const ringRef = useRef();
  const showRing = hovered || active;

  useFrame(() => {
    if (!ringRef.current) return;
    const target = showRing ? 1 : 0.0001;
    tmpScale.set(target, target, target);
    ringRef.current.scale.lerp(tmpScale, 0.18);
    ringRef.current.rotation.z += 0.006;
  });

  return (
    <group
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(id);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onHover(null);
        document.body.style.cursor = "default";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
      }}
    >
      {children}

      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[ringRadius * 0.86, ringRadius, 48]} />
        <meshBasicMaterial
          color={active ? COLORS.warnAmber : COLORS.energyCyan}
          transparent
          opacity={0.85}
          toneMapped={false}
        />
      </mesh>

      {showRing && label && (
        <Html position={[0, Math.min(ringRadius * 0.5, 0.9) + 0.9, 0]} center occlude={false} zIndexRange={[20, 0]}>
          <div
            style={{
              pointerEvents: "none",
              minWidth: 150,
              padding: "8px 12px",
              background: "rgba(6,10,13,0.88)",
              border: `1px solid ${active ? "rgba(255,184,77,0.5)" : "rgba(63,233,214,0.4)"}`,
              borderRadius: 8,
              color: COLORS.white,
              fontFamily: "'Segoe UI', system-ui, sans-serif",
              boxShadow: "0 8px 28px rgba(0,0,0,0.5)",
              whiteSpace: "nowrap",
            }}
          >
            <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 0.3 }}>{label}</div>
            {load && (
              <div style={{ fontSize: 11.5, opacity: 0.85, marginTop: 2 }}>
                Load <span style={{ fontWeight: 700, color: COLORS.energyCyan }}>{load}</span>
              </div>
            )}
            {status && (
              <div style={{ fontSize: 10.5, opacity: 0.7, marginTop: 2, letterSpacing: 0.5 }}>{status}</div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}
