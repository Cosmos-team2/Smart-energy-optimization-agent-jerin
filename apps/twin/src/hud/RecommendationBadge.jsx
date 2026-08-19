import { COLORS } from "../palette.js";

// Compact floating notification — replaces the old large recommendation
// card that used to sit permanently over the Compressor zone. Stays small
// at all times; clicking it opens the full detail in RecommendationDrawer.
export default function RecommendationBadge({ recommendation, approvalStatus, onOpen }) {
  const savings = recommendation.estimated_savings_inr.toLocaleString("en-US");
  const resolved = approvalStatus !== "PENDING";
  const accent = approvalStatus === "APPROVED" ? COLORS.energyCyan : approvalStatus === "REJECTED" ? COLORS.textMuted : COLORS.purpleGlow;

  return (
    <button
      onClick={onOpen}
      style={{
        position: "absolute",
        bottom: 20,
        right: 16,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 14px",
        background: "rgba(18,15,28,0.85)",
        border: `1px solid ${accent}55`,
        borderRadius: 10,
        color: COLORS.white,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        backdropFilter: "blur(8px)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.45)",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: 999, background: accent, flexShrink: 0 }} />
      <span>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5 }}>
          {recommendation.id}
          {!resolved && <span style={{ color: COLORS.textMuted, fontWeight: 400 }}> · OPTIMIZATION AVAILABLE</span>}
          {approvalStatus === "APPROVED" && <span style={{ color: COLORS.energyCyan, fontWeight: 400 }}> · APPLIED</span>}
          {approvalStatus === "REJECTED" && <span style={{ color: COLORS.textMuted, fontWeight: 400 }}> · REJECTED</span>}
        </div>
        {!resolved && <div style={{ fontSize: 11, color: COLORS.textMuted }}>{`₹${savings} estimated savings`}</div>}
      </span>
      <span style={{ fontSize: 10, color: COLORS.purpleGlow, fontWeight: 600, whiteSpace: "nowrap", marginLeft: 4 }}>
        {resolved ? "VIEW" : "VIEW ▸"}
      </span>
    </button>
  );
}
