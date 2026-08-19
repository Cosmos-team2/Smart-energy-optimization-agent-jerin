import { ZONES } from "../scene/config.js";
import { COLORS } from "../palette.js";

const ZONE_LABEL_BY_ID = Object.fromEntries(ZONES.map((z) => [z.id, z.label]));

// Full recommendation detail — opened on demand from RecommendationBadge,
// closed by default so the 3D facility is never permanently covered. Also
// carries the baseline/optimized peak comparison (folded in from the old
// standalone ComparisonPanel) so that context lives in one place.
export default function RecommendationDrawer({
  recommendation,
  approvalStatus,
  onApprove,
  onReject,
  onClose,
  disabled,
  baselinePeak,
  optimizedPeak,
  contractLimit,
}) {
  const zones = recommendation.target.map((id) => ZONE_LABEL_BY_ID[id] || id).join(", ");
  const confidencePct = Math.round(recommendation.confidence * 100);
  const savings = recommendation.estimated_savings_inr.toLocaleString("en-US");
  const baselineStatus = baselinePeak > contractLimit ? "ABOVE LIMIT" : "WITHIN LIMIT";
  const optimizedStatus = optimizedPeak > contractLimit ? "ABOVE LIMIT" : "WITHIN LIMIT";

  return (
    <div
      style={{
        position: "absolute",
        top: 64,
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(360px, 90vw)",
        padding: "16px 18px",
        background: "rgba(18,15,28,0.94)",
        border: `1px solid ${COLORS.purpleTrace}`,
        borderRadius: 12,
        color: COLORS.white,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        backdropFilter: "blur(10px)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.55)",
        fontSize: 12.5,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 11, letterSpacing: 1, opacity: 0.6, textTransform: "uppercase" }}>
          {recommendation.id} — Recommendation
        </span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.textMuted, fontSize: 14, cursor: "pointer", padding: 0 }}>
          ✕
        </button>
      </div>

      <div style={{ display: "flex", gap: 14, marginBottom: 4 }}>
        <Row label="Est. Savings" value={`₹${savings}`} />
        <Row label="Confidence" value={`${confidencePct}%`} />
      </div>
      <Row label="Cited Rule" value={recommendation.cited_rule} />
      <Row label="Affected Zones" value={zones} />

      <div style={{ height: 1, background: "rgba(237,233,254,0.08)", margin: "10px 0" }} />

      <div style={{ fontSize: 10.5, letterSpacing: 1, opacity: 0.6, marginBottom: 6, textTransform: "uppercase" }}>
        Peak Comparison
      </div>
      <div style={{ display: "flex", gap: 14 }}>
        <PeakBlock title="BASELINE" color={COLORS.warnRed} peak={baselinePeak} status={baselineStatus} />
        <PeakBlock title="OPTIMIZED" color={COLORS.energyCyan} peak={optimizedPeak} status={optimizedStatus} />
      </div>
      <div style={{ fontSize: 10.5, color: COLORS.textMuted, marginTop: 2 }}>{`Contract limit: ${contractLimit.toFixed(0)} kW`}</div>

      <div style={{ height: 1, background: "rgba(237,233,254,0.08)", margin: "10px 0" }} />

      {approvalStatus === "PENDING" && (
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onApprove} disabled={disabled} style={approveBtnStyle(disabled)}>
            APPROVE RECOMMENDATION
          </button>
          <button onClick={onReject} disabled={disabled} style={rejectBtnStyle(disabled)}>
            REJECT
          </button>
        </div>
      )}
      {approvalStatus === "APPROVED" && <div style={bannerStyle(COLORS.energyCyan)}>{"APPROVED — OPTIMIZATION APPLIED"}</div>}
      {approvalStatus === "REJECTED" && <div style={bannerStyle(COLORS.textMuted)}>{"REJECTED — NOT APPLIED"}</div>}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ padding: "1px 0", flex: 1, minWidth: 0 }}>
      <div style={{ opacity: 0.6, fontSize: 10 }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function PeakBlock({ title, color, peak, status }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 2 }}>{title}</div>
      <div style={{ fontSize: 15, fontWeight: 700 }}>{`${peak.toFixed(1)} kW`}</div>
      <div style={{ fontSize: 10.5, color, fontWeight: 600 }}>{status}</div>
    </div>
  );
}

function bannerStyle(color) {
  return {
    padding: "7px 8px",
    borderRadius: 6,
    border: `1px solid ${color}`,
    background: `${color}22`,
    color,
    fontSize: 11.5,
    fontWeight: 700,
    textAlign: "center",
  };
}

function approveBtnStyle(disabled) {
  return {
    flex: 1,
    padding: "8px 8px",
    borderRadius: 6,
    border: `1px solid ${COLORS.energyCyan}`,
    background: "rgba(103,232,249,0.14)",
    color: COLORS.energyCyan,
    fontSize: 10.5,
    fontWeight: 700,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.5 : 1,
  };
}

function rejectBtnStyle(disabled) {
  return {
    flex: 1,
    padding: "8px 8px",
    borderRadius: 6,
    border: "1px solid rgba(237,233,254,0.25)",
    background: "rgba(237,233,254,0.06)",
    color: COLORS.textMuted,
    fontSize: 10.5,
    fontWeight: 700,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.5 : 1,
  };
}
