import { COLORS } from "../palette.js";
import { SCENARIO_META } from "../data/faultScenarios.js";

const panelStyle = {
  position: "absolute",
  top: 16,
  right: 16,
  padding: "14px 16px",
  background: "rgba(10,8,20,0.82)",
  border: `1px solid ${COLORS.purpleTrace}`,
  borderRadius: 12,
  color: COLORS.white,
  fontFamily: "'Segoe UI', system-ui, sans-serif",
  backdropFilter: "blur(10px)",
  boxShadow: "0 4px 32px rgba(0,0,0,0.55)",
  minWidth: 240,
  maxWidth: 260,
  zIndex: 30,
};

const SCENARIO_KEYS = [
  "simultaneous_spike",
  "demand_breach",
  "compressor_fault",
  "hvac_thermal",
  "stagger_applied",
];

export default function ModePanel({
  activeScenario,
  onScenarioChange,
  onSimulate,
  simulating,
  simLabel,
  simFaultOverlay,
  mcpActiveScenario,
}) {
  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 9.5, letterSpacing: 1.4, opacity: 0.55, textTransform: "uppercase" }}>
          Fault Scenario
        </div>
        {mcpActiveScenario && mcpActiveScenario === activeScenario && (
          <span
            style={{
              fontSize: 8.5,
              fontWeight: 700,
              letterSpacing: 0.8,
              padding: "2px 6px",
              borderRadius: 999,
              background: "rgba(34,197,94,0.15)",
              color: "#4ade80",
              border: "1px solid rgba(34,197,94,0.3)",
            }}
          >
            MCP ACTIVE
          </span>
        )}
      </div>

      {/* Scenario selector grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginBottom: 10 }}>
        {SCENARIO_KEYS.map((key) => {
          const meta = SCENARIO_META[key];
          const isActive = activeScenario === key;
          const isMCP = mcpActiveScenario === key;
          return (
            <button
              key={key}
              onClick={() => !simulating && onScenarioChange(key)}
              disabled={simulating}
              style={{
                padding: "7px 8px",
                borderRadius: 8,
                border: isActive
                  ? `1px solid ${meta.color}`
                  : "1px solid rgba(240,237,255,0.1)",
                background: isActive
                  ? `${meta.color}20`
                  : "rgba(15,12,26,0.6)",
                color: isActive ? meta.color : COLORS.textMuted,
                fontSize: 10.5,
                fontWeight: isActive ? 700 : 400,
                cursor: simulating ? "default" : "pointer",
                opacity: simulating && !isActive ? 0.45 : 1,
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                gap: 2,
                transition: "all 0.18s",
                gridColumn: key === "stagger_applied" ? "1 / -1" : undefined,
              }}
            >
              <span style={{ fontSize: 12 }}>{meta.icon}</span>
              <span style={{ lineHeight: 1.2 }}>{meta.shortLabel}</span>
              {isMCP && (
                <span style={{ fontSize: 8, color: "#4ade80", fontWeight: 700 }}>← MCP</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Simulate button */}
      <button
        onClick={onSimulate}
        disabled={simulating}
        style={{
          width: "100%",
          padding: "9px 10px",
          borderRadius: 7,
          border: simulating
            ? `1px solid rgba(139,92,246,0.3)`
            : `1px solid ${COLORS.purple}`,
          background: simulating
            ? "rgba(139,92,246,0.12)"
            : "rgba(139,92,246,0.22)",
          color: simulating ? COLORS.textMuted : COLORS.purpleGlow,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 0.4,
          cursor: simulating ? "default" : "pointer",
          transition: "all 0.18s",
        }}
      >
        {simulating ? "⏳ Simulating…" : "▶ Simulate Fault Scenario"}
      </button>

      {/* Sim label */}
      {simulating && simLabel && (
        <div
          style={{
            marginTop: 8,
            fontSize: 10.5,
            color: COLORS.textMuted,
            lineHeight: 1.45,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: 8,
          }}
        >
          {simLabel}
        </div>
      )}

      {/* Live fault overlay callout */}
      {simulating && simFaultOverlay && (
        <FaultCallout overlay={simFaultOverlay} />
      )}

      {/* Scenario description */}
      {!simulating && (
        <div
          style={{
            marginTop: 8,
            fontSize: 9.5,
            color: COLORS.textDim,
            lineHeight: 1.45,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: 8,
          }}
        >
          {SCENARIO_META[activeScenario]?.description}
        </div>
      )}
    </div>
  );
}

function FaultCallout({ overlay }) {
  const bgMap = {
    normal:    "rgba(139,92,246,0.12)",
    warning:   "rgba(234,179,8,0.12)",
    critical:  "rgba(239,68,68,0.15)",
    breach:    "rgba(249,115,22,0.15)",
    penalty:   "rgba(239,68,68,0.12)",
    action:    "rgba(59,130,246,0.12)",
    optimized: "rgba(34,197,94,0.12)",
    resolved:  "rgba(34,197,94,0.15)",
  };
  const borderMap = {
    normal:    "rgba(139,92,246,0.3)",
    warning:   "rgba(234,179,8,0.35)",
    critical:  "rgba(239,68,68,0.45)",
    breach:    "rgba(249,115,22,0.4)",
    penalty:   "rgba(239,68,68,0.35)",
    action:    "rgba(59,130,246,0.35)",
    optimized: "rgba(34,197,94,0.35)",
    resolved:  "rgba(34,197,94,0.45)",
  };
  const colorMap = {
    normal:    "#c084fc",
    warning:   "#fbbf24",
    critical:  "#f87171",
    breach:    "#fb923c",
    penalty:   "#f87171",
    action:    "#60a5fa",
    optimized: "#4ade80",
    resolved:  "#4ade80",
  };

  return (
    <div
      style={{
        marginTop: 8,
        padding: "8px 10px",
        borderRadius: 8,
        background: bgMap[overlay.type] || bgMap.normal,
        border: `1px solid ${borderMap[overlay.type] || borderMap.normal}`,
        color: colorMap[overlay.type] || colorMap.normal,
        fontSize: 10.5,
        lineHeight: 1.45,
        fontWeight: 600,
      }}
    >
      {overlay.message}
      {overlay.penalty && (
        <div style={{ marginTop: 4, fontSize: 9.5, fontWeight: 400, opacity: 0.85 }}>
          {overlay.penalty}
        </div>
      )}
    </div>
  );
}
