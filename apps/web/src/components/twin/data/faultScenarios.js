/**
 * faultScenarios.js
 *
 * 5 distinct fault scenario step generators for the Digital Twin simulation.
 * Each scenario plays a unique, non-repeating sequence that tells a specific
 * "what can go wrong" story — driven by live MCP agent outputs.
 *
 * Step shape:
 *   { index, mode, holdMs, label?, hvacBadge?, compBadge?, faultOverlay? }
 *
 * faultOverlay is passed to Hud to show scenario-specific callouts.
 */

import { SPIKE_INDEX } from "../../../data/optimization.js";

// ─────────────────────────────────────────────────────────────
// SCENARIO 1 — Simultaneous Startup Spike (default / baseline)
// Both chiller and compressor come online at 06:00 AM together.
// ─────────────────────────────────────────────────────────────
export const SCENARIO_SIMULTANEOUS_SPIKE = [
  {
    index: 3,
    mode: "baseline",
    label: "05:00 AM — Facility ramping up, all loads nominal",
    holdMs: 700,
    faultOverlay: { type: "normal", message: "Pre-spike window — loads nominal" },
  },
  {
    index: SPIKE_INDEX - 1,
    mode: "baseline",
    label: "05:45 AM — Chiller #2 and Compressor #1 queued for simultaneous 06:00 AM startup",
    holdMs: 1000,
    faultOverlay: { type: "warning", message: "⚠ Simultaneous startup queued at 06:00 AM" },
  },
  {
    index: SPIKE_INDEX,
    mode: "baseline",
    label: "06:00 AM — SIMULTANEOUS INRUSH: Chiller +180 kW + Compressor +140 kW → 777.71 kW spike",
    holdMs: 2000,
    hvacBadge: { text: "INRUSH +180 kW", color: "#ff4444" },
    compBadge: { text: "INRUSH +140 kW", color: "#ff4444" },
    faultOverlay: { type: "critical", message: "⛔ 777.71 kW — EXCEEDS CONTRACT LIMIT" },
  },
  {
    index: SPIKE_INDEX + 1,
    mode: "baseline",
    label: "06:15 AM — Demand charge triggered: BESCOM billing at peak 15-min interval",
    holdMs: 1500,
    faultOverlay: { type: "penalty", message: "₹ Demand charge penalty locked in for this billing cycle" },
  },
  {
    index: SPIKE_INDEX + 2,
    mode: "baseline",
    label: "Unmitigated spike costs ₹1,30,000+/month in demand charges — rec_042 not applied",
    holdMs: 1500,
    faultOverlay: { type: "penalty", message: "Monthly loss: ₹1,30,000 demand charge — no optimization" },
  },
];

// ─────────────────────────────────────────────────────────────
// SCENARIO 2 — Demand Charge Breach (MCP-driven: tight limit)
// Activated when MCP selects a limit below the optimized peak.
// Shows the ₹ penalty accumulating in real time.
// ─────────────────────────────────────────────────────────────
export function buildDemandBreachSteps(contractLimitKw, monthlySavingsInr) {
  const penalty = Math.round((777.71 - contractLimitKw) * 450 * 1.15);
  return [
    {
      index: 3,
      mode: "baseline",
      label: `Contract demand limit set at ${contractLimitKw} kW — monitoring for breach`,
      holdMs: 700,
      faultOverlay: { type: "warning", message: `⚡ Limit: ${contractLimitKw} kW · watching 06:00 AM window` },
    },
    {
      index: SPIKE_INDEX - 1,
      mode: "baseline",
      label: "05:45 AM — Load approaching contract limit, demand charge threshold near",
      holdMs: 900,
      faultOverlay: { type: "warning", message: `⚠ Load rising — ${contractLimitKw} kW limit in jeopardy` },
    },
    {
      index: SPIKE_INDEX,
      mode: "baseline",
      label: `06:00 AM — BREACH: 777.71 kW spike EXCEEDS ${contractLimitKw} kW contract limit by ${(777.71 - contractLimitKw).toFixed(0)} kW`,
      holdMs: 2200,
      hvacBadge: { text: "LIMIT BREACHED", color: "#ff3333" },
      compBadge: { text: "LIMIT BREACHED", color: "#ff3333" },
      faultOverlay: {
        type: "breach",
        message: `⛔ BREACH +${(777.71 - contractLimitKw).toFixed(0)} kW over ${contractLimitKw} kW limit`,
        penalty: `₹${penalty.toLocaleString("en-IN")}/month penalty`,
      },
    },
    {
      index: SPIKE_INDEX + 1,
      mode: "baseline",
      label: `BESCOM demand charge applied: ₹450/kW × ${(777.71 - contractLimitKw).toFixed(0)} kW excess = ₹${penalty.toLocaleString("en-IN")}/month`,
      holdMs: 1800,
      faultOverlay: {
        type: "penalty",
        message: `Penalty locked: ₹${penalty.toLocaleString("en-IN")}/month`,
        penalty: `Run MCP stagger → save ₹${monthlySavingsInr.toLocaleString("en-IN")}/month`,
      },
    },
    {
      index: SPIKE_INDEX + 2,
      mode: "baseline",
      label: "Apply stagger schedule (rec_042) to prevent breach next cycle",
      holdMs: 1200,
      faultOverlay: { type: "action", message: "→ Approve rec_042 to prevent next breach" },
    },
  ];
}

// ─────────────────────────────────────────────────────────────
// SCENARIO 3 — Compressor Inrush Fault
// IsolationForest anomaly score < −0.42 → abnormal inrush event.
// ─────────────────────────────────────────────────────────────
export const SCENARIO_COMPRESSOR_FAULT = [
  {
    index: 3,
    mode: "baseline",
    label: "05:00 AM — IsolationForest anomaly classifier active, monitoring compressor signature",
    holdMs: 800,
    faultOverlay: { type: "normal", message: "🔍 IsolationForest: monitoring compressor inrush signature" },
  },
  {
    index: SPIKE_INDEX - 1,
    mode: "baseline",
    label: "05:50 AM — Outlier score crossing threshold: −0.42 → critical simultaneous startup detected",
    holdMs: 1200,
    compBadge: { text: "ANOMALY −0.42", color: "#f97316" },
    faultOverlay: { type: "warning", message: "⚠ Outlier score −0.42 → abnormal startup pattern" },
  },
  {
    index: SPIKE_INDEX,
    mode: "baseline",
    label: "06:00 AM — COMPRESSOR INRUSH FAULT: Screw Air Compressor #1 draws 300.2 kW on cold start",
    holdMs: 2200,
    compBadge: { text: "⛔ INRUSH FAULT", color: "#ef4444" },
    hvacBadge: { text: "PEAK LOAD", color: "#f97316" },
    faultOverlay: {
      type: "critical",
      message: "⛔ COMPRESSOR INRUSH: 300.2 kW cold-start surge",
      penalty: "Anomaly score: −0.42 (IsolationForest critical)",
    },
  },
  {
    index: SPIKE_INDEX + 1,
    mode: "baseline",
    label: "Cold-start inrush causes voltage sag on campus bus — protective relay risk",
    holdMs: 1400,
    compBadge: { text: "RELAY RISK", color: "#dc2626" },
    faultOverlay: { type: "critical", message: "⚡ Voltage sag on campus bus — protective relay at risk" },
  },
  {
    index: SPIKE_INDEX + 2,
    mode: "optimized",
    compBadge: { text: "SOFT START +20min", color: "#22c55e" },
    label: "Mitigation: soft-start compressor 20 min delayed, eliminates cold-start surge",
    holdMs: 1500,
    faultOverlay: { type: "resolved", message: "✓ Soft-start delay applied — inrush eliminated" },
  },
];

// ─────────────────────────────────────────────────────────────
// SCENARIO 4 — HVAC Thermal Runaway (MCP-driven: live weather)
// Triggered when Open-Meteo returns heatwave flag or T > 38°C.
// ─────────────────────────────────────────────────────────────
export function buildHVACThermalSteps(ambientTempC, heatwaveFlag) {
  const temp = ambientTempC.toFixed(1);
  const stressLabel = heatwaveFlag ? "HEATWAVE ACTIVE" : `High Ambient ${temp}°C`;
  return [
    {
      index: 3,
      mode: "baseline",
      label: `Open-Meteo: ${temp}°C ambient — HVAC demand elevated for pre-cooling`,
      holdMs: 800,
      hvacBadge: { text: `${temp}°C AMBIENT`, color: "#f59e0b" },
      faultOverlay: { type: "warning", message: `🌡 ${stressLabel} — HVAC demand spiking` },
    },
    {
      index: SPIKE_INDEX - 1,
      mode: "baseline",
      label: `Chillers running at 95%+ capacity — thermal load: ${temp}°C drives +35% HVAC uplift`,
      holdMs: 1200,
      hvacBadge: { text: "95% CAPACITY", color: "#f97316" },
      faultOverlay: { type: "warning", message: `HVAC at 95% — high ambient adds 35% cooling load` },
    },
    {
      index: SPIKE_INDEX,
      mode: "baseline",
      label: `HVAC THERMAL OVERLOAD: Chiller #2 trips at ${temp}°C — emergency load shed required`,
      holdMs: 2200,
      hvacBadge: { text: "⛔ THERMAL TRIP", color: "#ef4444" },
      faultOverlay: {
        type: "critical",
        message: `⛔ HVAC THERMAL TRIP at ${temp}°C ambient`,
        penalty: heatwaveFlag ? "HEATWAVE: +40% demand charge risk" : `High ambient: +25% HVAC load`,
      },
    },
    {
      index: SPIKE_INDEX + 1,
      mode: "baseline",
      label: "Zone 3 temperature rising — backup chiller cannot compensate at this ambient",
      holdMs: 1400,
      hvacBadge: { text: "ZONE TEMP ↑", color: "#dc2626" },
      faultOverlay: { type: "critical", message: "Zone 3 over-temp — occupant comfort at risk" },
    },
    {
      index: SPIKE_INDEX + 2,
      mode: "optimized",
      hvacBadge: { text: "PRE-COOL -1.5°C", color: "#06b6d4" },
      label: `Mitigation: pre-cool Zone 3 to 22.5°C before peak window — absorbs ${temp}°C thermal spike`,
      holdMs: 1500,
      faultOverlay: { type: "resolved", message: `✓ Pre-cool applied — thermal mass buffers ${temp}°C peak` },
    },
  ];
}

// ─────────────────────────────────────────────────────────────
// SCENARIO 5 — Stagger Applied (MCP-driven: post-optimization)
// Shows the actual MCP-computed stagger schedule visually.
// ─────────────────────────────────────────────────────────────
export function buildStaggerSteps(mcpState) {
  const { contractLimitKw, optimizedPeakKw, monthlySavingsInr, compressorDelayMin, chillerRampPct } = mcpState;
  const shavedKw = (777.71 - optimizedPeakKw).toFixed(1);
  return [
    {
      index: 3,
      mode: "optimized",
      hvacBadge: { text: "PRE-COOLING −1.5°C", color: "#7ec8ff" },
      label: `05:00 AM — Zone 3 pre-cooling to build thermal mass for ${contractLimitKw} kW target`,
      holdMs: 900,
      faultOverlay: { type: "action", message: `Pre-cool started — target limit: ${contractLimitKw} kW` },
    },
    {
      index: SPIKE_INDEX - 1,
      mode: "optimized",
      hvacBadge: { text: "READY", color: "#22c55e" },
      compBadge: { text: `DELAYED → 06:${String(compressorDelayMin).padStart(2, "0")}`, color: "#94a3b8" },
      label: `05:50 AM — Chiller thermal buffer charged · Compressor startup delayed ${compressorDelayMin} min`,
      holdMs: 1000,
      faultOverlay: { type: "action", message: `Stagger: compressor delayed ${compressorDelayMin} min · chiller at ${chillerRampPct}%` },
    },
    {
      index: SPIKE_INDEX,
      mode: "optimized",
      hvacBadge: { text: `SOFT RAMP ${chillerRampPct}%`, color: "#f59e0b" },
      compBadge: { text: `DELAYED → 06:${String(compressorDelayMin).padStart(2, "0")}`, color: "#64748b" },
      label: `06:00 AM — Chiller soft-ramped at ${chillerRampPct}% · Compressor offline for ${compressorDelayMin} min`,
      holdMs: 2000,
      faultOverlay: {
        type: "optimized",
        message: `✓ ${optimizedPeakKw.toFixed(0)} kW peak · under ${contractLimitKw} kW limit`,
        penalty: `Saving ₹${monthlySavingsInr.toLocaleString("en-IN")}/month`,
      },
    },
    {
      index: SPIKE_INDEX + 1,
      mode: "optimized",
      compBadge: { text: "RESTARTING (staggered)", color: "#f59e0b" },
      label: `06:${String(compressorDelayMin).padStart(2, "0")} AM — Compressor restarting on staggered schedule — ${shavedKw} kW shaved`,
      holdMs: 1400,
      faultOverlay: {
        type: "optimized",
        message: `Compressor back online — ${shavedKw} kW shaved`,
        penalty: `Monthly savings: ₹${monthlySavingsInr.toLocaleString("en-IN")}`,
      },
    },
    {
      index: SPIKE_INDEX + 2,
      mode: "optimized",
      label: `OPTIMIZATION COMPLETE — Peak held at ${optimizedPeakKw.toFixed(0)} kW · rec_042 stagger schedule active`,
      holdMs: 1800,
      faultOverlay: {
        type: "resolved",
        message: `✓ ${optimizedPeakKw.toFixed(0)} kW · ${contractLimitKw} kW limit respected`,
        penalty: `₹${monthlySavingsInr.toLocaleString("en-IN")}/month saved`,
      },
    },
  ];
}

// ─────────────────────────────────────────────────────────────
// Scenario Metadata (for the UI selector)
// ─────────────────────────────────────────────────────────────
export const SCENARIO_META = {
  simultaneous_spike: {
    key: "simultaneous_spike",
    label: "Simultaneous Startup",
    shortLabel: "Spike",
    icon: "⚡",
    color: "#ef4444",
    description: "Both chiller and compressor start at 06:00 AM → 777.71 kW peak",
  },
  demand_breach: {
    key: "demand_breach",
    label: "Demand Charge Breach",
    shortLabel: "Breach",
    icon: "⛔",
    color: "#f97316",
    description: "Spike exceeds MCP contract limit → BESCOM penalty triggered",
  },
  compressor_fault: {
    key: "compressor_fault",
    label: "Compressor Inrush",
    shortLabel: "Inrush",
    icon: "🔧",
    color: "#eab308",
    description: "IsolationForest anomaly −0.42 → cold-start 300 kW surge",
  },
  hvac_thermal: {
    key: "hvac_thermal",
    label: "HVAC Thermal Runaway",
    shortLabel: "Thermal",
    icon: "🌡",
    color: "#f59e0b",
    description: "High ambient temp from live weather → HVAC trips at capacity",
  },
  stagger_applied: {
    key: "stagger_applied",
    label: "Stagger Applied",
    shortLabel: "Optimized",
    icon: "✓",
    color: "#22c55e",
    description: "MCP stagger schedule active — shows last computed kW/savings",
  },
};
