import { COLORS } from "../palette.js";

const METRIC_LABEL = { hvac: "AIRFLOW", compressor: "PRESSURE", baseload: "LOAD" };

// Narrow right-side inspector — collapsed entirely unless a zone is
// selected (see spec: "Default: mostly collapsed/minimal"). Replaces a
// permanent large card with a small on-demand panel so the 3D facility
// stays visible.
export default function Inspector({ zone, value, ratio, spike, totalLoad, onClose }) {
  if (!zone) return null;

  const pct = totalLoad > 0 ? Math.round((value / totalLoad) * 100) : 0;
  const status = spike ? "SPIKE" : ratio > 0.55 ? "ACTIVE" : "NORMAL";
  const statusColor = spike ? COLORS.warnRed : ratio > 0.55 ? COLORS.energyCyan : COLORS.purpleGlow;
  const barPct = Math.round(Math.min(1, ratio) * 100);
  const metricLabel = METRIC_LABEL[zone.kind] || "LOAD";

  return (
    <div
      style={{
        position: "absolute",
        top: 210,
        right: 16,
        width: 210,
        padding: "12px 14px",
        background: "rgba(18,15,28,0.85)",
        border: `1px solid ${COLORS.purpleTrace}`,
        borderRadius: 10,
        color: COLORS.white,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        backdropFilter: "blur(8px)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.45)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase" }}>{zone.label}</div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: COLORS.textMuted,
            fontSize: 13,
            cursor: "pointer",
            lineHeight: 1,
            padding: 0,
          }}
        >
          ✕
        </button>
      </div>
      <div style={{ height: 1, background: "rgba(237,233,254,0.08)", margin: "6px 0 8px" }} />

      <div style={{ fontSize: 22, fontWeight: 700, color: zone.color }}>{value.toFixed(1)} kW</div>
      <div style={{ fontSize: 10.5, color: COLORS.textMuted, marginBottom: 10 }}>{pct}% of facility load</div>

      <div style={{ fontSize: 10, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6 }}>Status</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: statusColor, marginBottom: 10 }}>{`● ${status}`}</div>

      <div style={{ fontSize: 10, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6 }}>{metricLabel}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, marginBottom: 10 }}>
        <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(237,233,254,0.1)", overflow: "hidden" }}>
          <div style={{ width: `${barPct}%`, height: "100%", background: statusColor, borderRadius: 3 }} />
        </div>
        <span style={{ fontSize: 10.5, color: COLORS.textMuted, minWidth: 26, textAlign: "right" }}>{barPct}%</span>
      </div>

      <div style={{ fontSize: 10, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.6 }}>Zone</div>
      <div style={{ fontSize: 11, color: COLORS.textMuted }}>{zone.id}</div>
    </div>
  );
}
