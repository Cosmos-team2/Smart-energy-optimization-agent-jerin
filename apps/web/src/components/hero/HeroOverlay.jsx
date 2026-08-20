import { useState } from "react";
import { badgeForPhase } from "./story.js";
import { COLORS } from "./palette.js";
import {
  BASELINE_PEAK_KW,
  OPTIMIZED_PEAK_KW,
  CONTRACT_LIMIT_KW,
} from "./story.js";

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

// ─── Metric chip ─────────────────────────────────────────────────────────────
function MetricChip({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        padding: "10px 20px",
        borderLeft: "1px solid rgba(139,92,246,0.15)",
      }}
    >
      <div
        style={{
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: 2.2,
          textTransform: "uppercase",
          color: COLORS.textDim,
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: COLORS.textMuted,
          fontFamily: "'Inter', system-ui, sans-serif",
          letterSpacing: 0.1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ─── Story badge (top-right corner) ──────────────────────────────────────────
function StoryBadge({ badge }) {
  if (!badge) return null;
  const isDanger = badge.tone === "danger";
  return (
    <div
      style={{
        position: "absolute",
        top: 72,
        right: 28,
        padding: "10px 16px",
        borderRadius: 8,
        background: "rgba(7,7,15,0.88)",
        border: `1px solid ${isDanger ? "rgba(239,68,68,0.45)" : "rgba(63,233,214,0.4)"}`,
        fontFamily: "'Inter', system-ui, sans-serif",
        boxShadow: `0 8px 28px rgba(0,0,0,0.5), 0 0 20px ${isDanger ? "rgba(239,68,68,0.08)" : "rgba(63,233,214,0.06)"}`,
        backdropFilter: "blur(8px)",
        minWidth: 152,
        pointerEvents: "none",
        animation: "fadeInUp 0.3s ease",
      }}
    >
      <div
        style={{
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: 1.8,
          textTransform: "uppercase",
          color: isDanger ? "#f87171" : COLORS.energyCyan,
          marginBottom: 4,
        }}
      >
        {badge.title}
      </div>
      <div style={{ fontSize: 21, fontWeight: 700, color: COLORS.white, lineHeight: 1.1 }}>
        {badge.value}
      </div>
      <div style={{ fontSize: 10.5, color: COLORS.textDim, marginTop: 3, letterSpacing: 0.5 }}>
        {badge.sub}
      </div>
    </div>
  );
}

// ─── Main overlay ────────────────────────────────────────────────────────────
export default function HeroOverlay({ phase, onOpenHowItWorks, onExplore }) {
  const badge = badgeForPhase(phase);

  const [exploreHover, setExploreHover] = useState(false);
  const [watchHover, setWatchHover] = useState(false);

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

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

        {/* ── Story badge ─────────────────────────────────────────────────── */}
        <StoryBadge badge={badge} />

        {/* ── Bottom metrics strip ─────────────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 64,
            display: "flex",
            alignItems: "center",
            padding: "0 52px",
            pointerEvents: "none",
            background:
              "linear-gradient(to top, rgba(7,7,15,0.85) 0%, rgba(7,7,15,0) 100%)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "stretch",
              borderTop: "1px solid rgba(139,92,246,0.1)",
              paddingTop: 10,
              gap: 0,
              overflow: "hidden",
            }}
          >
            <MetricChip
              label="15-Min Peak Monitoring"
              value="Real-time demand intelligence"
            />
            <MetricChip
              label="Energy Optimization"
              value={`${OPTIMIZED_PEAK_KW.toFixed(1)} kW optimized peak`}
            />
            <MetricChip
              label="Contract Limit"
              value={`${CONTRACT_LIMIT_KW.toFixed(0)} kW`}
            />
            <MetricChip
              label="Recommendation"
              value="₹1,30,000 estimated savings"
            />
          </div>
        </div>
      </div>
    </>
  );
}
