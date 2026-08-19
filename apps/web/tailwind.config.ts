import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Base backgrounds ──────────────────────────────────────
        bg: {
          base:    "#0A0A14",
          deep:    "#07070F",
          surface: "#16161F",
          "surface-2": "#1E1E2A",
          "surface-3": "#242434",
        },
        // ── Accent / brand ────────────────────────────────────────
        accent: {
          violet:  "#8B5CF6",
          indigo:  "#6366F1",
          blue:    "#818CF8",
          pink:    "#C084FC",
          "violet-dim": "rgba(139,92,246,0.15)",
          "violet-glow": "rgba(139,92,246,0.08)",
        },
        // ── Text ──────────────────────────────────────────────────
        content: {
          primary: "#F0F0FF",
          muted:   "#A0A0B8",
          subtle:  "#6B6B8A",
        },
        // ── Border ────────────────────────────────────────────────
        border: {
          subtle:  "rgba(139,92,246,0.15)",
          DEFAULT: "rgba(139,92,246,0.25)",
          strong:  "rgba(139,92,246,0.5)",
        },
        // ── Semantic ──────────────────────────────────────────────
        success: "#34D399",
        warning: "#FBBF24",
        error:   "#F87171",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        heading: ["var(--font-manrope)", "Manrope", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "accent-gradient":   "linear-gradient(135deg, #8B5CF6, #6366F1, #818CF8)",
        "accent-gradient-h": "linear-gradient(90deg, #8B5CF6, #6366F1)",
        "glow-purple":       "radial-gradient(ellipse at center, rgba(139,92,246,0.25) 0%, transparent 70%)",
        "glow-indigo":       "radial-gradient(ellipse at center, rgba(99,102,241,0.20) 0%, transparent 70%)",
      },
      boxShadow: {
        "glow-sm":   "0 0 16px rgba(139,92,246,0.20)",
        "glow-md":   "0 0 32px rgba(139,92,246,0.30)",
        "glow-lg":   "0 0 60px rgba(139,92,246,0.20)",
        "card":      "0 4px 24px rgba(0,0,0,0.45)",
        "card-hover":"0 8px 40px rgba(0,0,0,0.55)",
      },
      borderRadius: {
        "card": "14px",
        "pill": "9999px",
      },
      animation: {
        "pulse-slow":  "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-pulse":  "glow-pulse 3s ease-in-out infinite alternate",
        "float":       "float 6s ease-in-out infinite",
      },
      keyframes: {
        "glow-pulse": {
          "0%":   { boxShadow: "0 0 16px rgba(139,92,246,0.15)" },
          "100%": { boxShadow: "0 0 36px rgba(139,92,246,0.45)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
