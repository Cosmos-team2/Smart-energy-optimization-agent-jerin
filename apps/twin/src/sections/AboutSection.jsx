import { COLORS } from "../hero/palette.js";
import { sectionWrap, eyebrowStyle, headingStyle, bodyStyle } from "./sectionStyles.js";

export default function AboutSection() {
  return (
    <section id="about" style={sectionWrap(COLORS.bgGraphite)}>
      <div style={eyebrowStyle}>About Us</div>
      <h2 style={headingStyle}>Energy waste is invisible until the bill arrives.</h2>
      <p style={bodyStyle}>
        OptiGrid exists for facilities that don't have a building management system watching every
        zone in real time. We built a platform that discovers a facility's equipment, models it as a
        digital twin, watches its real load against the contract limit, and proposes — never silently
        applies — the exact change needed to stay under it.
      </p>
    </section>
  );
}
