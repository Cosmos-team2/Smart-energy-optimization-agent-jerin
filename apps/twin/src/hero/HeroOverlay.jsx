import { useNavigate } from "react-router-dom";
import { badgeForPhase } from "./story.js";
import { COLORS } from "./palette.js";

export default function HeroOverlay({ phase }) {
  const navigate = useNavigate();
  const badge = badgeForPhase(phase);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {/* Headline block — kept small and low, the facility is the hero */}
      <div
        style={{
          position: "absolute",
          left: 28,
          bottom: 28,
          maxWidth: 420,
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 3,
            color: COLORS.energyCyan,
            marginBottom: 10,
            textTransform: "uppercase",
          }}
        >
          Autonomous Energy Intelligence
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(20px, 2.4vw, 30px)",
            lineHeight: 1.15,
            fontWeight: 700,
            color: COLORS.white,
            letterSpacing: 0.2,
          }}
        >
          Energy, before it becomes a cost.
        </h1>
        <p
          style={{
            marginTop: 10,
            marginBottom: 18,
            fontSize: 13,
            lineHeight: 1.5,
            color: "rgba(232,244,244,0.65)",
            maxWidth: 360,
          }}
        >
          Autonomous energy optimization for facilities without a BMS.
        </p>
        <button
          onClick={() => navigate("/twin")}
          style={{
            padding: "10px 18px",
            borderRadius: 6,
            border: `1px solid ${COLORS.energyCyan}`,
            background: "rgba(63,233,214,0.1)",
            color: COLORS.energyCyan,
            fontSize: 12.5,
            fontWeight: 700,
            letterSpacing: 0.6,
            cursor: "pointer",
            textTransform: "uppercase",
          }}
        >
          Explore your facility →
        </button>
      </div>

      {/* Floating telemetry badge — the product-story beats */}
      {badge && (
        <div
          style={{
            position: "absolute",
            top: 26,
            right: 26,
            padding: "10px 16px",
            borderRadius: 8,
            background: "rgba(6,10,13,0.82)",
            border: `1px solid ${badge.tone === "danger" ? "rgba(255,86,84,0.5)" : "rgba(63,233,214,0.45)"}`,
            fontFamily: "'Segoe UI', system-ui, sans-serif",
            boxShadow: "0 8px 28px rgba(0,0,0,0.5)",
            backdropFilter: "blur(6px)",
            minWidth: 150,
          }}
        >
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: 1.4,
              color: badge.tone === "danger" ? COLORS.warnRed : COLORS.energyCyan,
            }}
          >
            {badge.title}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.white, marginTop: 2 }}>{badge.value}</div>
          <div style={{ fontSize: 10.5, opacity: 0.65, color: COLORS.white, marginTop: 1, letterSpacing: 0.4 }}>
            {badge.sub}
          </div>
        </div>
      )}

      {/* corner mark, small brand/product context */}
      <div
        style={{
          position: "absolute",
          top: 26,
          left: 28,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 2,
          color: "rgba(232,244,244,0.5)",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          textTransform: "uppercase",
        }}
      >
        Smart Energy Twin
      </div>
    </div>
  );
}
