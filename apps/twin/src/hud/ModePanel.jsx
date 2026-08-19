import { COLORS } from "../palette.js";

const panelStyle = {
  position: "absolute",
  top: 16,
  right: 16,
  padding: "14px 16px",
  background: "rgba(16,12,26,0.78)",
  border: `1px solid ${COLORS.purpleTrace}`,
  borderRadius: 10,
  color: COLORS.white,
  fontFamily: "'Segoe UI', system-ui, sans-serif",
  backdropFilter: "blur(8px)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.45)",
  minWidth: 220,
};

export default function ModePanel({ mode, onModeChange, onSimulate, simulating, simLabel }) {
  return (
    <div style={panelStyle}>
      <div style={{ fontSize: 10.5, letterSpacing: 1.2, opacity: 0.6, marginBottom: 8, textTransform: "uppercase" }}>
        Scenario
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <ModeButton active={mode === "baseline"} disabled={simulating} onClick={() => onModeChange("baseline")}>
          Baseline
        </ModeButton>
        <ModeButton active={mode === "optimized"} disabled={simulating} onClick={() => onModeChange("optimized")}>
          Optimized
        </ModeButton>
      </div>
      <button
        onClick={onSimulate}
        disabled={simulating}
        style={{
          width: "100%",
          padding: "8px 10px",
          borderRadius: 6,
          border: `1px solid ${COLORS.purple}`,
          background: simulating ? "rgba(139,92,246,0.14)" : "rgba(139,92,246,0.2)",
          color: COLORS.purpleGlow,
          fontSize: 12.5,
          fontWeight: 600,
          letterSpacing: 0.3,
          cursor: simulating ? "default" : "pointer",
        }}
      >
        {simulating ? "Simulating…" : "▶ Simulate Recommendation"}
      </button>
      {simulating && simLabel && (
        <div style={{ marginTop: 8, fontSize: 11, color: COLORS.textMuted, lineHeight: 1.4 }}>{simLabel}</div>
      )}
    </div>
  );
}

function ModeButton({ active, disabled, onClick, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        padding: "6px 8px",
        borderRadius: 6,
        border: active ? `1px solid ${COLORS.purpleGlow}` : "1px solid rgba(240,237,255,0.15)",
        background: active ? "rgba(167,139,250,0.16)" : "transparent",
        color: active ? COLORS.purpleGlow : COLORS.textMuted,
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}
