import { COLORS } from "../hero/palette.js";
import { sectionWrap, eyebrowStyle, headingStyle, bodyStyle, cardStyle, cardTitleStyle, cardBodyStyle } from "./sectionStyles.js";

const FEATURES = [
  { title: "Digital Twin", desc: "A live 3D model of your facility, mapped to real equipment and real telemetry." },
  { title: "Real-time Energy Intelligence", desc: "15-minute peak monitoring against your contract demand limit, continuously." },
  { title: "AI Optimization", desc: "Recommendations generated from a MILP solver, citing the exact rule and equipment involved." },
  { title: "Operational Simulation", desc: "Preview a recommendation's effect before approving it — baseline vs. optimized, side by side." },
];

export default function PlatformSection() {
  return (
    <section id="platform" style={sectionWrap(COLORS.bg)}>
      <div style={eyebrowStyle}>Platform</div>
      <h2 style={headingStyle}>One intelligence layer for your facility.</h2>
      <p style={bodyStyle}>
        OptiGrid connects discovery, monitoring, simulation, and approval into a single continuous
        workflow — the digital twin is one capability inside it, not the whole product.
      </p>

      <div
        style={{
          marginTop: 48,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 18,
        }}
      >
        {FEATURES.map((f) => (
          <div key={f.title} style={cardStyle}>
            <div style={cardTitleStyle}>{f.title}</div>
            <div style={cardBodyStyle}>{f.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
