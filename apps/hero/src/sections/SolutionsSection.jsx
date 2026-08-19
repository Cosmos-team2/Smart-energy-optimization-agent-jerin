import { COLORS } from "../palette.js";
import { sectionWrap, eyebrowStyle, headingStyle, bodyStyle, cardStyle, cardTitleStyle, cardBodyStyle } from "./sectionStyles.js";

const SOLUTIONS = [
  { title: "Commercial Facilities", desc: "Offices, retail, and mixed-use buildings without a full building management system." },
  { title: "Industrial Facilities", desc: "Plants and warehouses with compressors, chillers, and process loads driving demand spikes." },
  { title: "Campuses", desc: "Multi-building sites where load across zones needs to be seen and optimized as one system." },
];

export default function SolutionsSection() {
  return (
    <section id="solutions" style={sectionWrap(COLORS.bgGraphite)}>
      <div style={eyebrowStyle}>Solutions</div>
      <h2 style={headingStyle}>Built for how your facility actually runs.</h2>
      <p style={bodyStyle}>Same intelligence layer, tuned to the equipment and load patterns of your site.</p>

      <div
        style={{
          marginTop: 48,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 18,
        }}
      >
        {SOLUTIONS.map((s) => (
          <div key={s.title} style={cardStyle}>
            <div style={cardTitleStyle}>{s.title}</div>
            <div style={cardBodyStyle}>{s.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
