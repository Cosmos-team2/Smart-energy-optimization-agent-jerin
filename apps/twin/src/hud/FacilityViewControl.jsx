import { COLORS } from "../palette.js";

const MODES = [
  { id: "exterior", label: "EXTERIOR" },
  { id: "cutaway", label: "CUTAWAY" },
  { id: "floorplan", label: "FLOOR PLAN" },
];

// Small segmented control — switches Architecture.jsx's wall/roof
// translucency. Geometry never changes, only how see-through it is.
export default function FacilityViewControl({ viewMode, onChange }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 150,
        right: 16,
        display: "flex",
        gap: 4,
        padding: 4,
        background: "rgba(18,15,28,0.78)",
        border: `1px solid ${COLORS.purpleTrace}`,
        borderRadius: 8,
        backdropFilter: "blur(8px)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      }}
    >
      {MODES.map((m) => {
        const active = viewMode === m.id;
        return (
          <button
            key={m.id}
            onClick={() => onChange(m.id)}
            style={{
              padding: "5px 8px",
              borderRadius: 5,
              border: active ? `1px solid ${COLORS.purpleGlow}` : "1px solid transparent",
              background: active ? "rgba(167,139,250,0.16)" : "transparent",
              color: active ? COLORS.purpleGlow : COLORS.textMuted,
              fontSize: 9.5,
              fontWeight: active ? 700 : 500,
              letterSpacing: 0.3,
              cursor: "pointer",
              fontFamily: "'Segoe UI', system-ui, sans-serif",
            }}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
