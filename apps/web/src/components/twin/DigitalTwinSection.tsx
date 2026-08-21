"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { ArrowDown, Sparkles, Radio } from "lucide-react";

import { useMCPState, ScenarioKey } from "@/hooks/useMCPState";
import {
  SCENARIO_SIMULTANEOUS_SPIKE,
  buildDemandBreachSteps,
  SCENARIO_COMPRESSOR_FAULT,
  buildHVACThermalSteps,
  buildStaggerSteps,
  SCENARIO_META,
} from "./data/faultScenarios.js";

import Floor from "./scene/Floor.jsx";
import PowerNode from "./scene/PowerNode.jsx";
import Architecture from "./scene/Architecture.jsx";
import EquipmentZone from "./scene/EquipmentZone.jsx";
import EnergyFlow from "./scene/EnergyFlow.jsx";
import {
  CONTRACT_LIMIT_KW,
  ELECTRICAL_ROOM_POSITION,
  POWER_NODE_POSITION,
  REC_042_TARGET_ZONES,
  ZONES,
} from "./scene/config.js";
import { COLORS } from "./palette.js";

import Hud from "./hud/Hud.jsx";
import TimeSlider from "./hud/TimeSlider.jsx";
import ModePanel from "./hud/ModePanel.jsx";
import FacilityViewControl from "./hud/FacilityViewControl.jsx";
import Inspector from "./hud/Inspector.jsx";
import RecommendationBadge from "./hud/RecommendationBadge.jsx";
import RecommendationDrawer from "./hud/RecommendationDrawer.jsx";

import {
  BASELINE_PEAK_KW,
  BASELINE_TIMELINE,
  OPTIMIZED_PEAK_KW,
  OPTIMIZED_TIMELINE,
  RECOMMENDATION,
  SPIKE_INDEX,
} from "./data/optimization.js";

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

function labelForStep(stepIdx: number) {
  for (let j = stepIdx; j >= 0; j--) {
    if (SIMULATION_STEPS[j]?.label) return SIMULATION_STEPS[j].label;
  }
  return "";
}

function staticHvacBadge(mode: string, index: number) {
  if (mode !== "optimized") return null;
  if (index <= 3) return { text: "PRE-COOLING", color: "#7ec8ff" };
  if (index === SPIKE_INDEX) return { text: "SOFT RAMP", color: "#ffb84d" };
  return null;
}

function staticCompBadge(mode: string, index: number) {
  if (mode !== "optimized") return null;
  if (index === SPIKE_INDEX || index === SPIKE_INDEX + 1)
    return { text: "DELAYED → 06:20", color: "#5a6472" };
  return null;
}

function CameraFocus({
  controlsRef,
  focusPosition,
}: {
  controlsRef: React.MutableRefObject<any>;
  focusPosition: [number, number, number] | null;
}) {
  const targetVec = useRef(new THREE.Vector3());

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls || !focusPosition) return;
    targetVec.current.set(focusPosition[0], 1.4, focusPosition[2]);
    controls.target.lerp(targetVec.current, 0.06);

    const offset = controls.object.position.clone().sub(controls.target);
    const len = offset.length();
    const desired = 9;
    if (Math.abs(len - desired) > 0.05) {
      offset.setLength(THREE.MathUtils.lerp(len, desired, 0.05));
      controls.object.position.copy(controls.target).add(offset);
    }
  });

  return null;
}

function getStepsForScenario(scenario: ScenarioKey, mcpState: any) {
  switch (scenario) {
    case "simultaneous_spike":
      return SCENARIO_SIMULTANEOUS_SPIKE;
    case "demand_breach":
      return buildDemandBreachSteps(mcpState.contractLimitKw, mcpState.monthlySavingsInr);
    case "compressor_fault":
      return SCENARIO_COMPRESSOR_FAULT;
    case "hvac_thermal":
      return buildHVACThermalSteps(mcpState.ambientTempC, mcpState.heatwaveFlag);
    case "stagger_applied":
      return buildStaggerSteps(mcpState);
    default:
      return SCENARIO_SIMULTANEOUS_SPIKE;
  }
}

export interface DigitalTwinSectionProps {
  facility?: {
    facilityId: string;
    name: string;
    address: string;
    lat: number;
    lon: number;
    discom: string;
  };
  onScrollToDashboard?: () => void;
}

export function DigitalTwinSection({
  facility = {
    facilityId: "f_001",
    name: "Bengaluru Tech Park – Phase 2",
    address: "Plot 42, Electronic City Phase 1, Bengaluru, KA 560100",
    lat: 12.8452,
    lon: 77.6602,
    discom: "BESCOM HT-2a Industrial",
  },
  onScrollToDashboard,
}: DigitalTwinSectionProps) {
  const { mcpState } = useMCPState();
  const [activeScenario, setActiveScenario] = useState<ScenarioKey>("simultaneous_spike");
  const [mode, setMode] = useState<"baseline" | "optimized">("baseline");
  const [index, setIndex] = useState(0);
  const [simulating, setSimulating] = useState(false);
  const [simStepIdx, setSimStepIdx] = useState(-1);
  const [approvalStatus, setApprovalStatus] = useState<"PENDING" | "APPROVED" | "REJECTED">(
    "PENDING"
  );
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"exterior" | "cutaway" | "floorplan">("cutaway");
  const [recOpen, setRecOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const controlsRef = useRef<any>();

  // Auto-sync scenario when MCP runs
  useEffect(() => {
    if (mcpState.hasRunMCP && mcpState.activeScenario) {
      setActiveScenario(mcpState.activeScenario);
    }
  }, [mcpState.hasRunMCP, mcpState.activeScenario, mcpState.lastRunTimestamp]);

  // ── React to governance approval: switch twin to stagger_applied execution mode ──
  useEffect(() => {
    if (!mcpState.isApprovedExecution) return;
    // Cancel any running simulation
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setSimulating(false);
    setSimStepIdx(-1);
    // Switch to stagger_applied scenario showing optimised peak
    setActiveScenario("stagger_applied");
    setMode("optimized");
    setIndex(SPIKE_INDEX);
    setApprovalStatus("APPROVED");
  }, [mcpState.isApprovedExecution]);

  const currentScenarioSteps = useMemo(
    () => getStepsForScenario(activeScenario, mcpState),
    [activeScenario, mcpState]
  );

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
    if (simStepIdx >= currentScenarioSteps.length) {
      setSimulating(false);
      setSimStepIdx(-1);
      return undefined;
    }
    const step = currentScenarioSteps[simStepIdx];
    setMode(step.mode as "baseline" | "optimized");
    setIndex(step.index);
    timeoutRef.current = setTimeout(() => setSimStepIdx((i) => i + 1), step.holdMs);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [simulating, simStepIdx, currentScenarioSteps]);

  const startSimulation = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setSimulating(true);
    setSimStepIdx(0);
  };

  const handleIndexChange = (i: number) => {
    if (simulating) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setSimulating(false);
      setSimStepIdx(-1);
    }
    setIndex(i);
  };

  const handleModeChange = (m: "baseline" | "optimized") => {
    if (simulating) return;
    setMode(m);
  };

  const cancelSimulation = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setSimulating(false);
    setSimStepIdx(-1);
  };

  const handleApprove = () => {
    if (approvalStatus !== "PENDING") return;
    cancelSimulation();
    setApprovalStatus("APPROVED");
    setMode("optimized");
    setIndex(SPIKE_INDEX);
    setRecOpen(false);
  };

  const handleReject = () => {
    if (approvalStatus !== "PENDING") return;
    cancelSimulation();
    setApprovalStatus("REJECTED");
    setMode("baseline");
    setIndex(SPIKE_INDEX);
    setRecOpen(false);
  };

  const activeStep =
    simulating && simStepIdx >= 0 && simStepIdx < currentScenarioSteps.length
      ? currentScenarioSteps[simStepIdx]
      : null;
  const simLabel = activeStep?.label || "";
  const simFaultOverlay = activeStep?.faultOverlay || null;

  const hvacBadge = activeStep?.hvacBadge || staticHvacBadge(mode, index);
  const compBadge = (activeStep as any)?.compBadge || staticCompBadge(mode, index);
  const hvacTint = hvacBadge?.color || null;
  const compTint = compBadge?.color || null;

  const activeTimeline = mode === "optimized" ? OPTIMIZED_TIMELINE : BASELINE_TIMELINE;
  const current = activeTimeline[index];

  const effectiveLimit = mcpState.contractLimitKw || CONTRACT_LIMIT_KW;
  const loadRatio = current.total_kw / effectiveLimit;
  const peakRiskPct = Math.round(loadRatio * 100);

  const showGhosts = mode === "optimized" && index === SPIKE_INDEX;

  const zoneMetrics = (zone: any) => {
    const value = (current as any)[zone.dataKey];
    const ratio = value / (maxByKey as any)[zone.dataKey];
    const spike = current.is_spike_event === 1 && REC_042_TARGET_ZONES.includes(zone.id);
    return { value, ratio, spike };
  };

  const selectedZone = ZONES.find((z) => z.id === selectedZoneId) || null;
  const selectedMetrics = selectedZone ? zoneMetrics(selectedZone) : null;
  const focusPosition = selectedZone
    ? (selectedZone.position as [number, number, number])
    : null;

  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const handleScrollDown = () => {
    if (onScrollToDashboard) {
      onScrollToDashboard();
    } else {
      document.getElementById("dashboard")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // When the camera is fully zoomed out and the user keeps scrolling down,
  // release OrbitControls so its wheel handler does NOT preventDefault and
  // the native page scroll reaches the next section (dashboard) below.
  // Capture phase runs BEFORE OrbitControls' own listener on the canvas.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const onWheelCapture = (e: WheelEvent) => {
      const controls = controlsRef.current;
      if (!controls) return;
      const distance = controls.object.position.distanceTo(controls.target);
      const atMaxZoom = distance >= 58; // near maxDistance (60)
      const scrollingDown = e.deltaY > 0;
      controls.enabled = !(atMaxZoom && scrollingDown);
    };
    el.addEventListener("wheel", onWheelCapture, { capture: true, passive: true });
    return () => el.removeEventListener("wheel", onWheelCapture, { capture: true });
  }, []);

  return (
    <div
      ref={wrapperRef}
      id="twin"
      className="relative w-full h-screen overflow-hidden"
      style={{ background: COLORS.bg }}
    >
      <Canvas
        style={{ width: "100%", height: "100%" }}
        camera={{ position: [12, 9.2, 25], fov: 40 }}
        onPointerMissed={() => setSelectedZoneId(null)}
      >
        <color attach="background" args={[COLORS.bg]} />
        <fog attach="fog" args={[COLORS.fog, 24, 48]} />

        <ambientLight intensity={0.9} />
        <directionalLight position={[9, 16, 8]} intensity={1.6} color="#efeaff" />
        <directionalLight position={[-10, 9, -12]} intensity={0.85} color={COLORS.purple} />
        <pointLight
          position={[0, 4, 11]}
          intensity={0.85}
          color={COLORS.energyCyan}
          distance={28}
        />
        <hemisphereLight args={[COLORS.purpleGlow, "#1c1830", 0.6]} />

        <Floor />
        <PowerNode position={POWER_NODE_POSITION} loadRatio={loadRatio} />
        <Architecture viewMode={viewMode} />

        <EnergyFlow
          start={POWER_NODE_POSITION}
          end={ELECTRICAL_ROOM_POSITION}
          ratio={loadRatio}
          spike={current.is_spike_event === 1}
        />

        {ZONES.map((zone) => {
          const { value, ratio, spike } = zoneMetrics(zone);

          const baselineValue = (BASELINE_TIMELINE[index] as any)[zone.dataKey];
          const ghostActive =
            showGhosts &&
            REC_042_TARGET_ZONES.includes(zone.id) &&
            baselineValue !== value;
          const ghostRatio = ghostActive
            ? baselineValue / (maxByKey as any)[zone.dataKey]
            : null;
          const ghostValue = ghostActive ? baselineValue : null;

          const statusBadge =
            zone.kind === "hvac"
              ? hvacBadge
              : zone.kind === "compressor"
              ? compBadge
              : null;
          const tintColor =
            zone.kind === "hvac"
              ? hvacTint
              : zone.kind === "compressor"
              ? compTint
              : null;

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
                selected={selectedZoneId === zone.id}
                dimmed={selectedZoneId != null && selectedZoneId !== zone.id}
                onSelect={setSelectedZoneId}
              />
              <EnergyFlow
                start={ELECTRICAL_ROOM_POSITION}
                end={zone.position}
                ratio={ratio}
                spike={spike}
              />
            </group>
          );
        })}

        <OrbitControls
          ref={controlsRef}
          target={[0, 1.4, 0.8]}
          maxDistance={60}
          minDistance={1.5}
          minPolarAngle={0.15}
          maxPolarAngle={1.55}
          minAzimuthAngle={-Math.PI}
          maxAzimuthAngle={Math.PI}
          enableDamping
          dampingFactor={0.08}
          enableZoom
        />
        <CameraFocus controlsRef={controlsRef} focusPosition={focusPosition} />
      </Canvas>

      {/* Facility identity header */}
      <div
        style={{
          position: "absolute",
          top: 18,
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          pointerEvents: "none",
          zIndex: 20,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 2,
            color: COLORS.white,
          }}
        >
          OPTIGRID <span style={{ color: COLORS.purpleGlow }}>/</span> DIGITAL TWIN
        </div>
        <div
          style={{
            fontSize: 9.5,
            letterSpacing: 1,
            color: COLORS.textDim,
            marginTop: 2,
            textTransform: "uppercase",
          }}
        >
          Facility {facility.facilityId} · {facility.discom} ·{" "}
          <span style={{ color: COLORS.energyCyan }}>● LIVE</span>
        </div>
      </div>

      {/* ── Governance Execution HUD Banner ── */}
      {approvalStatus !== "PENDING" && (
        <div
          style={{
            position: "absolute",
            top: 54,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 20,
            pointerEvents: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
          }}
        >
          <style>{`
            @keyframes twinExecPulse {
              0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.7), inset 0 0 12px rgba(16,185,129,0.15); }
              50% { box-shadow: 0 0 20px 6px rgba(16,185,129,0.3), inset 0 0 20px rgba(16,185,129,0.25); }
            }
            @keyframes twinBadgeBlink {
              0%, 100% { opacity: 1; } 50% { opacity: 0.6; }
            }
            @keyframes slideInBanner { from { opacity: 0; transform: translateX(-50%) translateY(-8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
          `}</style>

          {approvalStatus === "APPROVED" ? (
            <div style={{
              background: "linear-gradient(90deg, rgba(16,185,129,0.18), rgba(52,211,153,0.10), rgba(16,185,129,0.18))",
              border: "1px solid rgba(16,185,129,0.55)",
              borderRadius: 999,
              padding: "8px 22px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              animation: "twinExecPulse 2.4s ease-in-out infinite",
              fontFamily: "'Segoe UI', system-ui, sans-serif",
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: "#10B981",
                animation: "twinBadgeBlink 1.2s ease-in-out infinite",
                boxShadow: "0 0 8px #10B981",
                flexShrink: 0,
              }} />
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: "#10B981", textTransform: "uppercase" }}>
                EXECUTION ACTIVE
              </span>
              <span style={{ width: 1, height: 14, background: "rgba(16,185,129,0.35)" }} />
              <span style={{ fontSize: 10.5, fontWeight: 600, color: "#6EE7B7", letterSpacing: 0.5 }}>
                Stagger Plan · Peak {mcpState.optimizedPeakKw ? Math.round(mcpState.optimizedPeakKw) : 420} kW
              </span>
            </div>
          ) : (
            <div style={{
              background: "rgba(139,152,165,0.12)",
              border: "1px solid #8b98a5",
              borderRadius: 999,
              padding: "6px 16px",
              color: "#c8d0d8",
              fontFamily: "'Segoe UI', system-ui, sans-serif",
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: 0.4,
            }}>
              ✕ RECOMMENDATION REJECTED — baseline retained
            </div>
          )}

          {/* Step execution mini-indicators */}
          {approvalStatus === "APPROVED" && (
            <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
              {["PRE COOL", "DELAY START", "VERIFY"].map((label, i) => (
                <div key={i} style={{
                  fontSize: 8.5,
                  fontWeight: 700,
                  letterSpacing: 1,
                  color: "#10B981",
                  background: "rgba(16,185,129,0.12)",
                  border: "1px solid rgba(16,185,129,0.3)",
                  borderRadius: 4,
                  padding: "3px 7px",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}>
                  <span style={{ color: "#34D399" }}>✓</span>
                  {label}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating interactive HUD modules */}
      <Hud
        current={current}
        contractLimit={effectiveLimit}
        peakRiskPct={peakRiskPct}
        mode={mode}
        activeScenario={activeScenario}
        mcpState={mcpState}
      />
      <ModePanel
        activeScenario={activeScenario}
        onScenarioChange={setActiveScenario}
        onSimulate={startSimulation}
        simulating={simulating}
        simLabel={simLabel}
        simFaultOverlay={simFaultOverlay}
        mcpActiveScenario={mcpState.hasRunMCP ? mcpState.activeScenario : null}
      />
      <FacilityViewControl viewMode={viewMode} onChange={setViewMode} />
      <Inspector
        zone={selectedZone}
        value={selectedMetrics?.value ?? 0}
        ratio={selectedMetrics?.ratio ?? 0}
        spike={selectedMetrics?.spike ?? false}
        totalLoad={current.total_kw}
        onClose={() => setSelectedZoneId(null)}
      />

      <RecommendationBadge
        recommendation={RECOMMENDATION}
        approvalStatus={approvalStatus}
        onOpen={() => setRecOpen(true)}
      />
      {recOpen && (
        <RecommendationDrawer
          recommendation={RECOMMENDATION}
          approvalStatus={approvalStatus}
          onApprove={handleApprove}
          onReject={handleReject}
          onClose={() => setRecOpen(false)}
          disabled={simulating}
          baselinePeak={BASELINE_PEAK_KW}
          optimizedPeak={OPTIMIZED_PEAK_KW}
          contractLimit={CONTRACT_LIMIT_KW}
        />
      )}

      <TimeSlider
        timeline={BASELINE_TIMELINE}
        index={index}
        onChange={handleIndexChange}
      />

      {/* Transition indicator: scroll to telemetry dashboard */}
      <div className="absolute bottom-6 right-6 z-30 pointer-events-auto">
        <button
          onClick={handleScrollDown}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xl transition-all hover:scale-105 border border-purple-500/40 bg-slate-950/80 backdrop-blur-md text-purple-300 hover:text-white hover:border-purple-400"
        >
          <span>Scroll to Live Telemetry Dashboard</span>
          <ArrowDown className="h-3.5 w-3.5 animate-bounce text-purple-400" />
        </button>
      </div>
    </div>
  );
}

export default DigitalTwinSection;
