import { COLORS } from "../hero/palette.js";

export const sectionWrap = (bg = COLORS.bg) => ({
  position: "relative",
  background: bg,
  padding: "96px 8vw",
  borderTop: "1px solid rgba(139,92,246,0.08)",
  fontFamily: "'Inter', system-ui, sans-serif",
});

export const eyebrowStyle = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 2.4,
  textTransform: "uppercase",
  color: COLORS.purple,
  marginBottom: 14,
};

export const headingStyle = {
  margin: 0,
  fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: 700,
  fontSize: "clamp(26px, 3vw, 38px)",
  lineHeight: 1.2,
  color: COLORS.white,
  maxWidth: 640,
  letterSpacing: -0.3,
};

export const bodyStyle = {
  marginTop: 16,
  fontSize: 14.5,
  lineHeight: 1.7,
  color: COLORS.textMuted,
  maxWidth: 560,
};

export const cardStyle = {
  padding: "26px 22px",
  borderRadius: 12,
  border: "1px solid rgba(139,92,246,0.16)",
  background: "rgba(139,92,246,0.035)",
};

export const cardTitleStyle = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 16,
  fontWeight: 700,
  color: COLORS.white,
  marginBottom: 8,
};

export const cardBodyStyle = {
  fontSize: 13,
  lineHeight: 1.6,
  color: COLORS.textMuted,
};
