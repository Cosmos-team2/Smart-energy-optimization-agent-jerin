import { useState } from "react";
import { COLORS } from "./palette.js";

// ─── Logo ────────────────────────────────────────────────────────────────────
function OptiGridLogo() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        userSelect: "none",
      }}
    >
      {/* Lightning / energy bolt symbol */}
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>
        </defs>
        {/* Hexagon frame */}
        <polygon
          points="13,1.5 22.5,6.75 22.5,17.25 13,22.5 3.5,17.25 3.5,6.75"
          fill="none"
          stroke="url(#logo-grad)"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        {/* Bolt */}
        <polyline
          points="15.5,5 10,13 14,13 10.5,21"
          fill="none"
          stroke="url(#logo-grad)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize: 17,
          letterSpacing: 0.2,
          color: COLORS.white,
        }}
      >
        OptiGrid
      </span>
    </div>
  );
}

// ─── Main overlay ────────────────────────────────────────────────────────────
export default function HeroOverlay({ onOpenHowItWorks, onExplore }) {
  const [exploreHover, setExploreHover] = useState(false);
  const [watchHover, setWatchHover] = useState(false);

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        {/* ── Navigation bar — logo only ────────────────────────────────── */}
        <nav
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: 76,
            display: "flex",
            alignItems: "center",
            padding: "0 32px",
            pointerEvents: "auto",
            background: "linear-gradient(to bottom, rgba(7,7,15,0.75) 0%, rgba(7,7,15,0) 100%)",
            zIndex: 100,
          }}
        >
          <OptiGridLogo />
        </nav>

        {/* ── Hero headline block — left, mid-vertical ────────────────────── */}
        <div
          style={{
            position: "absolute",
            left: 52,
            top: "50%",
            transform: "translateY(-52%)",
            maxWidth: 430,
            pointerEvents: "auto",
          }}
        >
          {/* Eyebrow */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 18,
            }}
          >
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: COLORS.purple,
                boxShadow: `0 0 8px ${COLORS.purple}`,
              }}
            />
            <span
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: COLORS.purple,
              }}
            >
              Autonomous Energy Intelligence
            </span>
          </div>

          {/* Main headline */}
          <h1
            style={{
              margin: 0,
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: "clamp(28px, 2.9vw, 42px)",
              lineHeight: 1.12,
              color: COLORS.white,
              letterSpacing: -0.5,
            }}
          >
            Energy,
            <br />
            before it
            <br />
            <span style={{ color: COLORS.purpleGlow }}>becomes a cost.</span>
          </h1>

          {/* Supporting copy */}
          <p
            style={{
              marginTop: 16,
              marginBottom: 28,
              fontSize: 13.5,
              lineHeight: 1.65,
              color: COLORS.textMuted,
              maxWidth: 360,
            }}
          >
            OptiGrid uses real-time data and AI to predict,
            optimize, and prevent energy waste across
            your facilities.
          </p>

          {/* CTAs — See How It Works stacked under Explore Your Facility */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 14 }}>
            {/* Primary CTA */}
            <button
              id="hero-cta-explore"
              onClick={() => {
                if (onExplore) onExplore();
                else document.getElementById("map")?.scrollIntoView({ behavior: "smooth" });
              }}
              onMouseEnter={() => setExploreHover(true)}
              onMouseLeave={() => setExploreHover(false)}
              style={{
                padding: "11px 22px",
                borderRadius: 8,
                border: "1px solid rgba(139,92,246,0.6)",
                background: exploreHover
                  ? "rgba(139,92,246,0.32)"
                  : "rgba(139,92,246,0.22)",
                color: "#e0d8ff",
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 12.5,
                fontWeight: 700,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "background 0.2s, box-shadow 0.2s",
                boxShadow: exploreHover
                  ? "0 0 18px rgba(139,92,246,0.25)"
                  : "none",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Explore Your Facility
              <span style={{ fontSize: 14, opacity: 0.9 }}>→</span>
            </button>

            {/* Secondary CTA */}
            <button
              id="hero-cta-watch"
              onClick={onOpenHowItWorks}
              onMouseEnter={() => setWatchHover(true)}
              onMouseLeave={() => setWatchHover(false)}
              style={{
                background: "none",
                border: "none",
                padding: "4px 4px",
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 12.5,
                fontWeight: 600,
                color: watchHover ? COLORS.white : COLORS.textMuted,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "color 0.2s",
                letterSpacing: 0.2,
              }}
            >
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  border: `1px solid ${watchHover ? "rgba(240,237,255,0.4)" : "rgba(240,237,255,0.18)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "border-color 0.2s",
                  flexShrink: 0,
                }}
              >
                <svg width="8" height="9" viewBox="0 0 8 9" fill="none">
                  <path d="M1 1L7 4.5L1 8V1Z" fill="currentColor" />
                </svg>
              </span>
              See How It Works
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
