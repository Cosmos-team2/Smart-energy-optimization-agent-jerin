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
    ringRef.current.rotation.z += 0.005;
  });

  // Status color mapping
  const isHot = status?.includes("SPIKE") || status?.includes("HIGH");
  const isWarn = status?.includes("RAMP") || status?.includes("DELAYED");
  const statusColor = isHot ? COLORS.warnRed : isWarn ? COLORS.warnAmber : COLORS.energyCyan;
  const ringColor = active ? COLORS.purpleGlow : COLORS.purple;

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

      {/* Selection / hover ring — OptiGrid purple */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[ringRadius * 0.86, ringRadius, 48]} />
        <meshBasicMaterial
          color={ringColor}
          transparent
          opacity={0.75}
          toneMapped={false}
        />
      </mesh>

      {/* Tooltip — shown on hover or select */}
      {showRing && label && (
        <Html
          position={[0, Math.min(ringRadius * 0.5, 0.9) + 1.1, 0]}
          center
          occlude={false}
          zIndexRange={[20, 0]}
        >
          <div
            style={{
              pointerEvents: "none",
              minWidth: 148,
              padding: "9px 13px",
              background: "rgba(7,7,15,0.92)",
              border: `1px solid ${active ? "rgba(167,139,250,0.5)" : "rgba(139,92,246,0.3)"}`,
              borderRadius: 8,
              color: COLORS.white,
              fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
              boxShadow: "0 8px 28px rgba(0,0,0,0.6), 0 0 16px rgba(139,92,246,0.08)",
              whiteSpace: "nowrap",
              backdropFilter: "blur(8px)",
            }}
          >
            {/* Equipment name */}
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 1.6,
                textTransform: "uppercase",
                color: "rgba(240,237,255,0.55)",
                marginBottom: 4,
              }}
            >
              {label}
            </div>

            {/* Load value — large */}
            {load && (
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: COLORS.white,
                  lineHeight: 1.1,
                  marginBottom: 5,
                  fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                }}
              >
                {load}
              </div>
            )}

            {/* Status dot + label */}
            {status && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  color: statusColor,
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: statusColor,
                    flexShrink: 0,
                    boxShadow: `0 0 5px ${statusColor}`,
                  }}
                />
                {status}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}
