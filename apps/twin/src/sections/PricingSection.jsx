import { COLORS } from "../hero/palette.js";
import { sectionWrap, eyebrowStyle, headingStyle } from "./sectionStyles.js";

export default function PricingSection({ onOpenDemo }) {
  return (
    <section id="pricing" style={sectionWrap(COLORS.bg)}>
      <div style={eyebrowStyle}>Pricing</div>
      <h2 style={headingStyle}>Talk to us about your facility.</h2>
      <p style={{ marginTop: 16, fontSize: 14.5, color: COLORS.textMuted, maxWidth: 520 }}>
        Every facility's equipment mix and contract terms are different — pricing is scoped after a
        short walkthrough, not off a generic tier.
      </p>
      <button
        onClick={onOpenDemo}
        style={{
          marginTop: 30,
          padding: "13px 26px",
          borderRadius: 8,
          border: "1px solid rgba(139,92,246,0.6)",
          background: "linear-gradient(135deg, rgba(139,92,246,0.95), rgba(109,40,217,0.95))",
          color: "#fff",
          fontFamily: "'Inter', system-ui, sans-serif",
          fontWeight: 700,
          fontSize: 12.5,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          cursor: "pointer",
        }}
      >
        Book a Demo
      </button>
    </section>
  );
}
