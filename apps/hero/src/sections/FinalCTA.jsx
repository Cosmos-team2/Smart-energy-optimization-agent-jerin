import { useNavigate } from "react-router-dom";
import { COLORS } from "../palette.js";

export default function FinalCTA() {
  const navigate = useNavigate();
  return (
    <section
      id="final-cta"
      style={{
        position: "relative",
        background: `radial-gradient(ellipse 70% 100% at 50% 100%, rgba(139,92,246,0.1) 0%, transparent 70%), ${COLORS.bgGraphite}`,
        padding: "110px 8vw",
        textAlign: "center",
        borderTop: "1px solid rgba(139,92,246,0.08)",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <h2
        style={{
          margin: "0 auto",
          maxWidth: 620,
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize: "clamp(26px, 3.4vw, 40px)",
          lineHeight: 1.2,
          color: COLORS.white,
          letterSpacing: -0.4,
        }}
      >
        See energy <span style={{ color: COLORS.purpleGlow }}>before it becomes a cost.</span>
      </h2>
      <button
        onClick={() => navigate("/facilities")}
        style={{
          marginTop: 34,
          padding: "13px 28px",
          borderRadius: 8,
          border: "1px solid rgba(139,92,246,0.6)",
          background: "rgba(139,92,246,0.16)",
          color: "#e0d8ff",
          fontFamily: "'Inter', system-ui, sans-serif",
          fontWeight: 700,
          fontSize: 12.5,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          cursor: "pointer",
        }}
      >
        Explore Your Facility →
      </button>

      <div
        style={{
          marginTop: 70,
          paddingTop: 26,
          borderTop: "1px solid rgba(139,92,246,0.08)",
          fontSize: 11.5,
          color: COLORS.textDim,
          letterSpacing: 0.3,
        }}
      >
        © {new Date().getFullYear()} OptiGrid — Autonomous Energy Intelligence
      </div>
    </section>
  );
}
