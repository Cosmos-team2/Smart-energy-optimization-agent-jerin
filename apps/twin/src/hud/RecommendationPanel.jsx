import { ZONES } from "../scene/config.js";

const ZONE_LABEL_BY_ID = Object.fromEntries(ZONES.map((z) => [z.id, z.label]));

// Right-side, directly beneath the Scenario (Mode) panel — both anchored
// top:16/right:16, this one starts at top:156 so it stacks under it with a
// small gap. That keeps it clear of the timeline (bottom-center) and
// ComparisonPanel (bottom-left); the layout below is kept compact (2-col
// grid for the two short fields, buttons side by side) so it also clears
// Compressor 1's label, which starts lower on the screen, at normal desktop
// viewport sizes. Content/values themselves are unchanged.
const panelStyle = {
  position: "absolute",
  top: 150,
  right: 16,
  padding: "10px 12px",
  background: "rgba(10,14,20,0.75)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10,
  color: "#e6edf3",
  fontFamily: "'Segoe UI', system-ui, sans-serif",
  backdropFilter: "blur(6px)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
  width: "clamp(220px, 20vw, 250px)",
  maxHeight: "calc(100vh - 170px)",
  overflowY: "auto",
  fontSize: 12,
};

// All fields below (id, estimated_savings_inr, confidence, cited_rule,
// target) come straight from rec_042's own recommendation object — nothing
// here is computed. approvalStatus/onApprove/onReject are local UI state
// only (see Twin.jsx) — no backend call is made.
export default function RecommendationPanel({ recommendation, approvalStatus, onApprove, onReject, disabled }) {
  const zones = recommendation.target.map((id) => ZONE_LABEL_BY_ID[id] || id).join(", ");
  const confidencePct = Math.round(recommendation.confidence * 100);
  const savings = recommendation.estimated_savings_inr.toLocaleString("en-US");

  return (
    <div style={panelStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 10.5, letterSpacing: 1, opacity: 0.6, textTransform: "uppercase" }}>
          {recommendation.id} — Recommendation
        </span>
        <StatusPill status={approvalStatus} />
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <Row label="Est. Savings" value={`₹${savings}`} />
        <Row label="Confidence" value={`${confidencePct}%`} />
      </div>
      <Row label="Cited Rule" value={recommendation.cited_rule} />
      <Row label="Affected Zones" value={zones} />

      <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "4px 0" }} />

      {approvalStatus === "PENDING" && (
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={onApprove} disabled={disabled} style={approveBtnStyle(disabled)}>
            APPROVE RECOMMENDATION
          </button>
          <button onClick={onReject} disabled={disabled} style={rejectBtnStyle(disabled)}>
            REJECT
          </button>
        </div>
      )}

      {approvalStatus === "APPROVED" && (
        <div style={bannerStyle("#3ddc84")}>{"APPROVED — OPTIMIZATION APPLIED"}</div>
      )}

      {approvalStatus === "REJECTED" && (
        <div style={bannerStyle("#8b98a5")}>{"REJECTED — NOT APPLIED"}</div>
      )}
    </div>
  );
}

function StatusPill({ status }) {
  const color = status === "APPROVED" ? "#3ddc84" : status === "REJECTED" ? "#8b98a5" : "#faad14";
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.5,
        padding: "2px 6px",
        borderRadius: 999,
        color,
        border: `1px solid ${color}`,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ padding: "1px 0", flex: 1, minWidth: 0 }}>
      <div style={{ opacity: 0.65, fontSize: 10.5 }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function bannerStyle(color) {
  return {
    padding: "6px 8px",
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
    padding: "7px 8px",
    borderRadius: 6,
    border: "1px solid #3ddc84",
    background: "rgba(61,220,132,0.18)",
    color: "#3ddc84",
    fontSize: 10.5,
    fontWeight: 700,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.5 : 1,
  };
}

function rejectBtnStyle(disabled) {
  return {
    flex: 1,
    padding: "7px 8px",
    borderRadius: 6,
    border: "1px solid #ff4d4f",
    background: "rgba(255,77,79,0.12)",
    color: "#ff7875",
    fontSize: 10.5,
    fontWeight: 700,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.5 : 1,
  };
}
