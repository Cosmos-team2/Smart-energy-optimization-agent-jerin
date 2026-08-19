import { COLORS } from "../palette.js";
import { sectionWrap, eyebrowStyle, headingStyle, bodyStyle } from "./sectionStyles.js";

const RESOURCES = [
  { title: "Energy Intelligence", tag: "Overview" },
  { title: "Peak Demand Guide", tag: "Guide" },
  { title: "Digital Twin Overview", tag: "Product" },
];

export default function ResourcesSection() {
  return (
    <section id="resources" style={sectionWrap(COLORS.bg)}>
      <div style={eyebrowStyle}>Resources</div>
      <h2 style={headingStyle}>Learn the fundamentals.</h2>
      <p style={bodyStyle}>Placeholder content for now — this becomes a real library as the platform grows.</p>

      <div style={{ marginTop: 44, display: "flex", flexDirection: "column", maxWidth: 640 }}>
        {RESOURCES.map((r, i) => (
          <div
            key={r.title}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "18px 4px",
              borderTop: i === 0 ? "1px solid rgba(139,92,246,0.14)" : "none",
              borderBottom: "1px solid rgba(139,92,246,0.14)",
              cursor: "default",
            }}
          >
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15.5, fontWeight: 600, color: COLORS.white }}>
              {r.title}
            </span>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: COLORS.textDim,
                border: "1px solid rgba(240,237,255,0.14)",
                borderRadius: 999,
                padding: "3px 10px",
              }}
            >
              {r.tag}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
