import ModalShell from "./ModalShell.jsx";
import { COLORS } from "../palette.js";

const STEPS = [
  { n: "01", title: "Monitor", desc: "Continuous real-time visibility into every zone's load." },
  { n: "02", title: "Detect", desc: "AI flags demand spikes before they hit the contract limit." },
  { n: "03", title: "Optimize", desc: "A recommendation is generated, citing the exact rule violated." },
  { n: "04", title: "Simulate", desc: "Preview the optimized schedule against the real baseline." },
  { n: "05", title: "Approve", desc: "An operator reviews and approves before anything changes." },
];

export default function HowItWorksModal({ open, onClose }) {
  return (
    <ModalShell open={open} onClose={onClose} maxWidth={620}>
      <h2
        style={{
          margin: "0 0 6px",
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 22,
          fontWeight: 700,
          color: COLORS.white,
        }}
      >
        How OptiGrid works.
      </h2>
      <p style={{ margin: "0 0 26px", fontSize: 13, lineHeight: 1.5, color: COLORS.textMuted }}>
        One continuous loop, from raw telemetry to an approved optimization.
      </p>

      {/* animated energy-flow graphic */}
      <div style={{ position: "relative", height: 3, background: "rgba(139,92,246,0.15)", borderRadius: 2, margin: "0 6px 30px" }}>
        <div
          style={{
            position: "absolute",
            top: -3.5,
            left: 0,
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: COLORS.purpleGlow,
            boxShadow: `0 0 10px ${COLORS.purpleGlow}`,
            animation: "optigrid-flow 3.2s linear infinite",
          }}
        />
        {STEPS.map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: -2.5,
              left: `${(i / (STEPS.length - 1)) * 100}%`,
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: COLORS.bgGraphite,
              border: `1.5px solid ${COLORS.purple}`,
              transform: "translateX(-50%)",
            }}
          />
        ))}
        <style>{`
          @keyframes optigrid-flow {
            0%   { left: 0%; opacity: 0; }
            8%   { opacity: 1; }
            92%  { opacity: 1; }
            100% { left: 100%; opacity: 0; }
          }
        `}</style>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 14 }}>
        {STEPS.map((step) => (
          <div
            key={step.n}
            style={{
              padding: "14px 12px",
              borderRadius: 10,
              border: "1px solid rgba(139,92,246,0.16)",
              background: "rgba(139,92,246,0.04)",
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.purple, letterSpacing: 1, marginBottom: 6 }}>
              {step.n}
            </div>
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 14.5,
                fontWeight: 700,
                color: COLORS.white,
                marginBottom: 5,
              }}
            >
              {step.title}
            </div>
            <div style={{ fontSize: 11.5, lineHeight: 1.45, color: COLORS.textMuted }}>{step.desc}</div>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}
