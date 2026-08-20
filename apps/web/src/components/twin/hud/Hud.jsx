import { COLORS } from "../palette.js";

// All values shown come from the current spike-data.json timeline entry
// (real seed_facility_data.json readings) and CONTRACT_LIMIT_KW, which is
// pulled from rec_042.json's reasoning text.
export default function Hud({ current, contractLimit, peakRiskPct, mode }) {
  const overLimit = current.total_kw > contractLimit;
  const riskColor = peakRiskPct >= 100 ? COLORS.warnRed : peakRiskPct >= 75 ? COLORS.warnAmber : COLORS.energyCyan;

  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        left: 16,
        padding: "14px 18px",
        background: "rgba(16,12,26,0.78)",
        border: `1px solid ${COLORS.purpleTrace}`,
        borderRadius: 10,
        color: COLORS.white,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        minWidth: 220,
        backdropFilter: "blur(8px)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.45)",
        pointerEvents: "none",
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
          Facility Load
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 0.5,
            padding: "2px 7px",
            borderRadius: 999,
            color: mode === "optimized" ? COLORS.purpleGlow : COLORS.textMuted,
            border: `1px solid ${mode === "optimized" ? COLORS.purpleGlow : "rgba(240,237,255,0.2)"}`,
            textTransform: "uppercase",
          }}
        >
          {mode}
        </span>
      </div>
      <Row label="Current Load" value={`${current.total_kw.toFixed(1)} kW`} color={overLimit ? COLORS.warnRed : undefined} />
      <Row label="Contract Limit" value={`${contractLimit.toFixed(1)} kW`} />
      <Row label="Peak Risk" value={`${peakRiskPct}%`} color={riskColor} />
      {current.is_spike_event === 1 && (
        <div
          style={{
            marginTop: 10,
            padding: "4px 8px",
            background: "rgba(239,68,68,0.14)",
            border: `1px solid ${COLORS.warnRed}`,
            borderRadius: 6,
            fontSize: 11.5,
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
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "3px 0", fontSize: 13 }}>
      <span style={{ opacity: 0.65 }}>{label}</span>
      <span style={{ fontWeight: 600, color: color || COLORS.white }}>{value}</span>
    </div>
  );
}
