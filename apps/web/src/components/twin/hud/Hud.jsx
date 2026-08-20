import { COLORS } from "../palette.js";
import { SCENARIO_META } from "../data/faultScenarios.js";

export default function Hud({ current, contractLimit, peakRiskPct, mode, activeScenario, mcpState }) {
  const overLimit = current.total_kw > contractLimit;
  const riskColor = peakRiskPct >= 100 ? COLORS.warnRed : peakRiskPct >= 75 ? COLORS.warnAmber : COLORS.energyCyan;
  const meta = SCENARIO_META[activeScenario] || SCENARIO_META.simultaneous_spike;

  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        left: 16,
        padding: "14px 18px",
        background: "rgba(16,12,26,0.82)",
        border: `1px solid ${COLORS.purpleTrace}`,
        borderRadius: 12,
        color: COLORS.white,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        minWidth: 230,
        backdropFilter: "blur(10px)",
        boxShadow: "0 4px 28px rgba(0,0,0,0.5)",
        pointerEvents: "none",
        zIndex: 30,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 10.5, letterSpacing: 1.2, opacity: 0.6, textTransform: "uppercase" }}>
          Facility Telemetry
        </span>
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: 0.5,
            padding: "2px 7px",
            borderRadius: 999,
            color: meta.color,
            border: `1px solid ${meta.color}50`,
            background: `${meta.color}15`,
            textTransform: "uppercase",
          }}
        >
          {meta.shortLabel}
        </span>
      </div>
      <Row label="Current Load" value={`${current.total_kw.toFixed(1)} kW`} color={overLimit ? COLORS.warnRed : undefined} />
      <Row label="Contract Target" value={`${contractLimit.toFixed(1)} kW`} />
      <Row label="Peak Risk" value={`${peakRiskPct}%`} color={riskColor} />

      {mcpState?.hasRunMCP && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px dashed rgba(255,255,255,0.1)" }}>
          <Row label="MCP Savings" value={`₹${mcpState.monthlySavingsInr.toLocaleString("en-IN")}/mo`} color="#4ade80" />
          <Row label="Live Weather" value={`${mcpState.ambientTempC}°C`} color={mcpState.heatwaveFlag ? "#f87171" : undefined} />
        </div>
      )}

      {current.is_spike_event === 1 && (
        <div
          style={{
            marginTop: 10,
            padding: "5px 8px",
            background: "rgba(239,68,68,0.16)",
            border: `1px solid ${COLORS.warnRed}`,
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            color: "#ff9d9d",
            textAlign: "center",
          }}
        >
          ⚠ SPIKE EVENT DETECTED
        </div>
      )}
    </div>
  );
}

function Row({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "3px 0", fontSize: 12 }}>
      <span style={{ opacity: 0.65 }}>{label}</span>
      <span style={{ fontWeight: 600, color: color || COLORS.white }}>{value}</span>
    </div>
  );
}
