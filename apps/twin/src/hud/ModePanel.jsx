const panelStyle = {
  position: "absolute",
  top: 16,
  right: 16,
  padding: "14px 16px",
  background: "rgba(10,14,20,0.75)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10,
  color: "#e6edf3",
  fontFamily: "'Segoe UI', system-ui, sans-serif",
  backdropFilter: "blur(6px)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
  minWidth: 220,
};

export default function ModePanel({ mode, onModeChange, onSimulate, simulating, simLabel }) {
  return (
    <div style={panelStyle}>
      <div style={{ fontSize: 11, letterSpacing: 1, opacity: 0.6, marginBottom: 8, textTransform: "uppercase" }}>
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
          border: "1px solid #3ddc84",
          background: simulating ? "rgba(61,220,132,0.12)" : "rgba(61,220,132,0.18)",
          color: "#3ddc84",
          fontSize: 13,
          fontWeight: 600,
          cursor: simulating ? "default" : "pointer",
        }}
      >
        {simulating ? "Simulating…" : "▶ Simulate Recommendation"}
      </button>
      {simulating && simLabel && (
        <div style={{ marginTop: 8, fontSize: 11.5, color: "#9fb0c0", lineHeight: 1.4 }}>{simLabel}</div>
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
        border: active ? "1px solid #e6edf3" : "1px solid rgba(255,255,255,0.15)",
        background: active ? "rgba(230,237,243,0.15)" : "transparent",
        color: active ? "#e6edf3" : "#8b98a5",
        fontSize: 12.5,
        fontWeight: active ? 600 : 400,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}
