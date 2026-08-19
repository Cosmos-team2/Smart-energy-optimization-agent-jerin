import { useNavigate } from "react-router-dom";

export default function FacilitiesPlaceholder() {
  const navigate = useNavigate();
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#07070f",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        color: "rgba(232,230,255,0.55)",
        gap: 24,
      }}
    >
      {/* OptiGrid logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <polygon points="14,2 18,11 27,11 20,17 23,26 14,20 5,26 8,17 1,11 10,11" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinejoin="round"/>
          <line x1="14" y1="6" x2="14" y2="14" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="14" cy="14" r="2" fill="#8b5cf6"/>
        </svg>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: "#e8e6ff", letterSpacing: 0.3 }}>
          OptiGrid
        </span>
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "rgba(139,92,246,0.7)", marginBottom: 4 }}>
        COMING SOON
      </div>
      <h1 style={{ margin: 0, fontSize: 32, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: "#e8e6ff", textAlign: "center" }}>
        Facility Map
      </h1>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, textAlign: "center", maxWidth: 380, color: "rgba(232,230,255,0.45)" }}>
        Search, filter, and select facilities from your connected portfolio.
        Real-time status, alerts, and energy performance — all in one map.
      </p>
      <button
        onClick={() => navigate("/")}
        style={{
          marginTop: 8,
          padding: "10px 22px",
          borderRadius: 8,
          border: "1px solid rgba(139,92,246,0.4)",
          background: "rgba(139,92,246,0.1)",
          color: "#c4b5fd",
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: 0.5,
          cursor: "pointer",
          fontFamily: "'Inter', system-ui, sans-serif",
          transition: "background 0.2s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(139,92,246,0.2)")}
        onMouseLeave={e => (e.currentTarget.style.background = "rgba(139,92,246,0.1)")}
      >
        ← Back to OptiGrid
      </button>
    </div>
  );
}
