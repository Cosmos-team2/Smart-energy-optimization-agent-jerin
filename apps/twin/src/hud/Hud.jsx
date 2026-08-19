// All values shown come from the current spike-data.json timeline entry
// (real seed_facility_data.json readings) and CONTRACT_LIMIT_KW, which is
// pulled from rec_042.json's reasoning text.
export default function Hud({ current, contractLimit, peakRiskPct, mode }) {
  const overLimit = current.total_kw > contractLimit;
  const riskColor = peakRiskPct >= 100 ? "#ff4d4f" : peakRiskPct >= 75 ? "#faad14" : "#52c41a";

  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        left: 16,
        padding: "14px 18px",
        background: "rgba(10,14,20,0.75)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10,
        color: "#e6edf3",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        minWidth: 220,
        backdropFilter: "blur(6px)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
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
        <span style={{ fontSize: 11, letterSpacing: 1, opacity: 0.6, textTransform: "uppercase" }}>
          Facility Load
        </span>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: 0.5,
            padding: "2px 7px",
            borderRadius: 999,
            color: mode === "optimized" ? "#3ddc84" : "#8b98a5",
            border: `1px solid ${mode === "optimized" ? "#3ddc84" : "rgba(255,255,255,0.2)"}`,
            textTransform: "uppercase",
          }}
        >
          {mode}
        </span>
      </div>
      <Row label="Current Load" value={`${current.total_kw.toFixed(1)} kW`} color={overLimit ? "#ff7875" : undefined} />
      <Row label="Contract Limit" value={`${contractLimit.toFixed(1)} kW`} />
      <Row label="Peak Risk" value={`${peakRiskPct}%`} color={riskColor} />
      {current.is_spike_event === 1 && (
        <div
          style={{
            marginTop: 10,
            padding: "4px 8px",
            background: "rgba(255,77,79,0.15)",
            border: "1px solid #ff4d4f",
            borderRadius: 6,
            fontSize: 12,
            color: "#ff7875",
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
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "4px 0", fontSize: 14 }}>
      <span style={{ opacity: 0.7 }}>{label}</span>
      <span style={{ fontWeight: 600, color: color || "#e6edf3" }}>{value}</span>
    </div>
  );
}
