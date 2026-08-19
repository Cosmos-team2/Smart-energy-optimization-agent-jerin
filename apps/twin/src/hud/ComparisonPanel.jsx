// baselinePeak is rec_042.json's baseline_peak_kw (777.71, the actual
// seed_facility_data.json reading at the spike). optimizedPeak is 397.71 kW,
// the verified output of Model/MILP_optimizer.py — NOT rec_042.json's own
// optimized_peak_kw field (420.0), which doesn't trace back to any
// computation in the repo. See src/data/optimization.js for the full trace
// and the per-equipment breakdown used in the 3D view.
export default function ComparisonPanel({ baselinePeak, optimizedPeak, contractLimit }) {
  const baselineStatus = baselinePeak > contractLimit ? "ABOVE LIMIT" : "WITHIN LIMIT";
  const optimizedStatus = optimizedPeak > contractLimit ? "ABOVE LIMIT" : "WITHIN LIMIT";

  return (
    <div
      style={{
        position: "absolute",
        bottom: 20,
        left: 16,
        padding: "12px 16px",
        background: "rgba(10,14,20,0.75)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10,
        color: "#e6edf3",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        backdropFilter: "blur(6px)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        minWidth: 200,
        fontSize: 12.5,
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: 1, opacity: 0.6, marginBottom: 8, textTransform: "uppercase" }}>
        rec_042 — Peak Comparison
      </div>

      <Block title="BASELINE" color="#ff7875" peak={baselinePeak} limit={contractLimit} status={baselineStatus} />
      <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "8px 0" }} />
      <Block title="OPTIMIZED" color="#3ddc84" peak={optimizedPeak} limit={contractLimit} status={optimizedStatus} />
    </div>
  );
}

function Block({ title, color, peak, limit, status }) {
  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 3, letterSpacing: 0.5 }}>{title}</div>
      <Row label="Peak" value={`${peak.toFixed(1)} kW`} />
      <Row label="Contract" value={`${limit.toFixed(0)} kW`} />
      <Row label="Status" value={status} color={color} />
    </div>
  );
}

function Row({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "1px 0" }}>
      <span style={{ opacity: 0.65 }}>{label}</span>
      <span style={{ fontWeight: 600, color: color || "#e6edf3" }}>{value}</span>
    </div>
  );
}
