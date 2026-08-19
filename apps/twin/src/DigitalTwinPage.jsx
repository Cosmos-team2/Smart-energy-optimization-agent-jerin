import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import Floor from "./scene/Floor.jsx";
import PowerNode from "./scene/PowerNode.jsx";
import EquipmentZone from "./scene/EquipmentZone.jsx";
import EnergyFlow from "./scene/EnergyFlow.jsx";
import { CONTRACT_LIMIT_KW, POWER_NODE_POSITION, REC_042_TARGET_ZONES, ZONES } from "./scene/config.js";

import Hud from "./hud/Hud.jsx";
import TimeSlider from "./hud/TimeSlider.jsx";
import ModePanel from "./hud/ModePanel.jsx";
import ComparisonPanel from "./hud/ComparisonPanel.jsx";
import RecommendationPanel from "./hud/RecommendationPanel.jsx";

import {
  BASELINE_PEAK_KW,
  BASELINE_TIMELINE,
  OPTIMIZED_PEAK_KW,
  OPTIMIZED_TIMELINE,
  RECOMMENDATION,
  SPIKE_INDEX,
} from "./data/optimization.js";

// Scripted replay for the "Simulate Recommendation" button. Every `index`
// here points at a REAL timeline slot (0-7, same 8 real timestamps used by
// the slider). `mode` picks baseline vs. optimized data for that slot.
// Badges/tints are presentation-only labels naming which rec_042 action is
// in effect — they don't change any kW number, only which dataset/slot is
// shown and when.
const SIMULATION_STEPS = [
  { index: 0, mode: "baseline", label: "Replaying real timeline from 05:00…", holdMs: 500 },
  { index: 1, mode: "baseline", holdMs: 450 },
  { index: 2, mode: "baseline", holdMs: 450 },
  {
    index: 3,
    mode: "baseline",
    hvacBadge: { text: "PRE-COOLING", color: "#7ec8ff" },
    label: "rec_042 action: pre-cool HVAC Zone 3 (05:00-05:45, -1.5°C)",
    holdMs: 900,
  },
  {
    index: SPIKE_INDEX,
    mode: "baseline",
    label: "BASELINE — unmitigated 06:00 spike: 777.71 kW (exceeds 500 kW limit)",
    holdMs: 1600,
  },
  {
    index: SPIKE_INDEX,
    mode: "optimized",
    hvacBadge: { text: "SOFT RAMP", color: "#ffb84d" },
    compBadge: { text: "DELAYED → 06:20", color: "#5a6472" },
    label: "rec_042 applied: chiller soft-ramped, compressor restart delayed to 06:20",
    holdMs: 1900,
  },
  {
    index: SPIKE_INDEX + 1,
    mode: "optimized",
    compBadge: { text: "RESTARTING (staggered)", color: "#ffd166" },
    label: "Compressor restarting on the staggered schedule",
    holdMs: 1100,
  },
  { index: SPIKE_INDEX + 2, mode: "optimized", holdMs: 500 },
  {
    index: SPIKE_INDEX + 3,
    mode: "optimized",
    label: "Optimized peak held at 397.71 kW — within the 500 kW contract limit",
    holdMs: 1100,
  },
];

function labelForStep(stepIdx) {
  for (let j = stepIdx; j >= 0; j--) {
    if (SIMULATION_STEPS[j].label) return SIMULATION_STEPS[j].label;
  }
  return "";
}

function staticHvacBadge(mode, index) {
  if (mode !== "optimized") return null;
  if (index <= 3) return { text: "PRE-COOLING", color: "#7ec8ff" };
  if (index === SPIKE_INDEX) return { text: "SOFT RAMP", color: "#ffb84d" };
  return null;
}

function staticCompBadge(mode, index) {
  if (mode !== "optimized") return null;
  if (index === SPIKE_INDEX || index === SPIKE_INDEX + 1) return { text: "DELAYED → 06:20", color: "#5a6472" };
  return null;
}

export default function DigitalTwin() {
  const [mode, setMode] = useState("baseline");
  const [index, setIndex] = useState(0);
  const [simulating, setSimulating] = useState(false);
  const [simStepIdx, setSimStepIdx] = useState(-1);
  // Local UI state only — PENDING | APPROVED | REJECTED. No API call is
  // made; there's no real approval endpoint yet, so nothing is persisted.
  const [approvalStatus, setApprovalStatus] = useState("PENDING");
  const timeoutRef = useRef(null);

  // Per-channel max across the real BASELINE timeline — used only to scale
  // equipment block height/particle rate consistently across both modes.
  const maxByKey = useMemo(() => {
    const maxes = { base_kw: 0, hvac_kw: 0, comp_kw: 0 };
    BASELINE_TIMELINE.forEach((t) => {
      maxes.base_kw = Math.max(maxes.base_kw, t.base_kw);
      maxes.hvac_kw = Math.max(maxes.hvac_kw, t.hvac_kw);
      maxes.comp_kw = Math.max(maxes.comp_kw, t.comp_kw);
    });
    return maxes;
  }, []);

  useEffect(() => {
    if (!simulating || simStepIdx < 0) return undefined;
    if (simStepIdx >= SIMULATION_STEPS.length) {
      setSimulating(false);
      setSimStepIdx(-1);
      return undefined;
    }
    const step = SIMULATION_STEPS[simStepIdx];
    setMode(step.mode);
    setIndex(step.index);
    timeoutRef.current = setTimeout(() => setSimStepIdx((i) => i + 1), step.holdMs);
    return () => clearTimeout(timeoutRef.current);
  }, [simulating, simStepIdx]);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const startSimulation = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setSimulating(true);
    setSimStepIdx(0);
  };

  const handleIndexChange = (i) => {
    if (simulating) {
      clearTimeout(timeoutRef.current);
      setSimulating(false);
      setSimStepIdx(-1);
    }
    setIndex(i);
  };

  const handleModeChange = (m) => {
    if (simulating) return;
    setMode(m);
  };

  const cancelSimulation = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setSimulating(false);
    setSimStepIdx(-1);
  };

  // Approve/reject are local UI state transitions only (requirement: no
  // fake API call). Both force the twin to the timeline slot where the
  // difference is visible (the spike slot) so the decision's effect is
  // immediately obvious, then leave the timeline free to scrub from there.
  const handleApprove = () => {
    if (approvalStatus !== "PENDING") return;
    cancelSimulation();
    setApprovalStatus("APPROVED");
    setMode("optimized");
    setIndex(SPIKE_INDEX);
  };

  const handleReject = () => {
    if (approvalStatus !== "PENDING") return;
    cancelSimulation();
    setApprovalStatus("REJECTED");
    setMode("baseline");
    setIndex(SPIKE_INDEX);
  };

  const activeStep = simulating && simStepIdx >= 0 && simStepIdx < SIMULATION_STEPS.length ? SIMULATION_STEPS[simStepIdx] : null;
  const simLabel = simulating && simStepIdx >= 0 ? labelForStep(Math.min(simStepIdx, SIMULATION_STEPS.length - 1)) : "";

  const hvacBadge = simulating ? activeStep?.hvacBadge || null : staticHvacBadge(mode, index);
  const compBadge = simulating ? activeStep?.compBadge || null : staticCompBadge(mode, index);
  const hvacTint = hvacBadge?.color || null;
  const compTint = compBadge?.color || null;

  const activeTimeline = mode === "optimized" ? OPTIMIZED_TIMELINE : BASELINE_TIMELINE;
  const current = activeTimeline[index];

  const loadRatio = current.total_kw / CONTRACT_LIMIT_KW;
  const peakRiskPct = Math.round(loadRatio * 100);

  const showGhosts = mode === "optimized" && index === SPIKE_INDEX;

  return (
    <div style={{ position: "fixed", inset: 0, width: "100%", height: "100%", background: "#0a0e14", overflow: "hidden" }}>
      <Canvas style={{ width: "100%", height: "100%" }} camera={{ position: [3.5, 10, 15], fov: 40 }}>
        <color attach="background" args={["#0a0e14"]} />
        <fog attach="fog" args={["#0a0e14", 18, 36]} />
        <ambientLight intensity={0.55} />
        <pointLight position={[10, 10, 10]} intensity={1} />

        <Floor />
        <PowerNode position={POWER_NODE_POSITION} loadRatio={loadRatio} />

        {ZONES.map((zone) => {
          const value = current[zone.dataKey];
          const ratio = value / maxByKey[zone.dataKey];
          const spike = current.is_spike_event === 1 && REC_042_TARGET_ZONES.includes(zone.id);

          const baselineValue = BASELINE_TIMELINE[index][zone.dataKey];
          const ghostActive = showGhosts && REC_042_TARGET_ZONES.includes(zone.id) && baselineValue !== value;
          const ghostRatio = ghostActive ? baselineValue / maxByKey[zone.dataKey] : null;
          const ghostValue = ghostActive ? baselineValue : null;

          const statusBadge = zone.kind === "hvac" ? hvacBadge : zone.kind === "compressor" ? compBadge : null;
          const tintColor = zone.kind === "hvac" ? hvacTint : zone.kind === "compressor" ? compTint : null;

          return (
            <group key={zone.id}>
              <EquipmentZone
                zone={zone}
                value={value}
                ratio={ratio}
                spike={spike}
                ghostRatio={ghostRatio}
                ghostValue={ghostValue}
                statusBadge={statusBadge}
                tintColor={tintColor}
              />
              <EnergyFlow start={POWER_NODE_POSITION} end={zone.position} ratio={ratio} color={zone.color} spike={spike} />
            </group>
          );
        })}

        <OrbitControls
          target={[0, 1.2, 1.5]}
          maxDistance={30}
          minDistance={5}
          minPolarAngle={0.25}
          maxPolarAngle={Math.PI / 2 - 0.03}
        />
      </Canvas>

      {approvalStatus !== "PENDING" && (
        <div
          style={{
            position: "absolute",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "8px 18px",
            borderRadius: 999,
            background: approvalStatus === "APPROVED" ? "rgba(61,220,132,0.15)" : "rgba(139,152,165,0.15)",
            border: `1px solid ${approvalStatus === "APPROVED" ? "#3ddc84" : "#8b98a5"}`,
            color: approvalStatus === "APPROVED" ? "#3ddc84" : "#c8d0d8",
            fontFamily: "'Segoe UI', system-ui, sans-serif",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 0.5,
            pointerEvents: "none",
          }}
        >
          {approvalStatus === "APPROVED"
            ? "✓ OPTIMIZATION APPLIED — rec_042"
            : "✕ RECOMMENDATION REJECTED — baseline retained"}
        </div>
      )}

      <Hud current={current} contractLimit={CONTRACT_LIMIT_KW} peakRiskPct={peakRiskPct} mode={mode} />
      <ModePanel
        mode={mode}
        onModeChange={handleModeChange}
        onSimulate={startSimulation}
        simulating={simulating}
        simLabel={simLabel}
      />
      <ComparisonPanel baselinePeak={BASELINE_PEAK_KW} optimizedPeak={OPTIMIZED_PEAK_KW} contractLimit={CONTRACT_LIMIT_KW} />
      <RecommendationPanel
        recommendation={RECOMMENDATION}
        approvalStatus={approvalStatus}
        onApprove={handleApprove}
        onReject={handleReject}
        disabled={simulating}
      />
      <TimeSlider timeline={BASELINE_TIMELINE} index={index} onChange={handleIndexChange} />
    </div>
  );
}
