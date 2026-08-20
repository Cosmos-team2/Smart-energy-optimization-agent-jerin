import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

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

// Smoothly pans/dollies the OrbitControls target toward a selected zone
// without ever teleporting — nudges target + camera distance a little each
// frame, preserving the user's current azimuth/polar angle.
function CameraFocus({ controlsRef, focusPosition }) {
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

export default function DigitalTwin() {
  // Read URL search params with localStorage persistence fallback
  const facilityContext = useMemo(() => {
    if (typeof window === "undefined") {
      return { facilityId: "f_001", lat: 12.8452, lon: 77.6602, discom: "BESCOM HT-2a Industrial" };
    }
    const searchParams = new URLSearchParams(window.location.search);
    const urlFacilityId = searchParams.get("facilityId");
    const urlLat = searchParams.get("lat");
    const urlLon = searchParams.get("lon");
    const urlDiscom = searchParams.get("discom");

    const facilityId = urlFacilityId || localStorage.getItem("optigrid_facilityId") || "f_001";
    const lat = parseFloat(urlLat || localStorage.getItem("optigrid_lat") || "12.8452");
    const lon = parseFloat(urlLon || localStorage.getItem("optigrid_lon") || "77.6602");
    const discom = urlDiscom || localStorage.getItem("optigrid_discom") || "BESCOM HT-2a Industrial";

    // Persist to localStorage for page refresh resilience
    try {
      if (urlFacilityId) localStorage.setItem("optigrid_facilityId", urlFacilityId);
      if (urlLat) localStorage.setItem("optigrid_lat", String(urlLat));
      if (urlLon) localStorage.setItem("optigrid_lon", String(urlLon));
      if (urlDiscom) localStorage.setItem("optigrid_discom", urlDiscom);
    } catch {
      // In case localStorage is disabled/restricted
    }

    return { facilityId, lat, lon, discom };
  }, []);

  const [mode, setMode] = useState("baseline");
  const [index, setIndex] = useState(0);
  const [simulating, setSimulating] = useState(false);
  const [simStepIdx, setSimStepIdx] = useState(-1);
  // Local UI state only — PENDING | APPROVED | REJECTED. No API call is
  // made; there's no real approval endpoint yet, so nothing is persisted.
  const [approvalStatus, setApprovalStatus] = useState("PENDING");
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [viewMode, setViewMode] = useState("cutaway");
  const [recOpen, setRecOpen] = useState(false);
  const timeoutRef = useRef(null);
  const controlsRef = useRef();

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

  const zoneMetrics = (zone) => {
    const value = current[zone.dataKey];
    const ratio = value / maxByKey[zone.dataKey];
    const spike = current.is_spike_event === 1 && REC_042_TARGET_ZONES.includes(zone.id);
    return { value, ratio, spike };
  };

  const selectedZone = ZONES.find((z) => z.id === selectedZoneId) || null;
  const selectedMetrics = selectedZone ? zoneMetrics(selectedZone) : null;
  const focusPosition = selectedZone ? selectedZone.position : null;

  return (
    <div style={{ position: "fixed", inset: 0, width: "100%", height: "100%", background: COLORS.bg, overflow: "hidden" }}>
      <Canvas
        style={{ width: "100%", height: "100%" }}
        camera={{ position: [12, 9.2, 25], fov: 40 }}
        onPointerMissed={() => setSelectedZoneId(null)}
      >
        <color attach="background" args={[COLORS.bg]} />
        <fog attach="fog" args={[COLORS.fog, 24, 48]} />

        {/* ambient fill so geometry never reads as a black silhouette */}
        <ambientLight intensity={0.9} />
        {/* large soft key light, warm-neutral */}
        <directionalLight position={[9, 16, 8]} intensity={1.6} color="#efeaff" />
        {/* purple rim light from behind/above the facility */}
        <directionalLight position={[-10, 9, -12]} intensity={0.85} color={COLORS.purple} />
        {/* cyan fill from the front-low, picks up equipment detail */}
        <pointLight position={[0, 4, 11]} intensity={0.85} color={COLORS.energyCyan} distance={28} />
        <hemisphereLight args={[COLORS.purpleGlow, "#1c1830", 0.6]} />

        <Floor />
        <PowerNode position={POWER_NODE_POSITION} loadRatio={loadRatio} />
        <Architecture viewMode={viewMode} />

        {/* trunk feed: grid -> electrical room */}
        <EnergyFlow start={POWER_NODE_POSITION} end={ELECTRICAL_ROOM_POSITION} ratio={loadRatio} spike={current.is_spike_event === 1} />

        {ZONES.map((zone) => {
          const { value, ratio, spike } = zoneMetrics(zone);

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
                selected={selectedZoneId === zone.id}
                dimmed={selectedZoneId != null && selectedZoneId !== zone.id}
                onSelect={setSelectedZoneId}
              />
              <EnergyFlow start={ELECTRICAL_ROOM_POSITION} end={zone.position} ratio={ratio} spike={spike} />
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

      {/* facility identity — subtle top-center brand/status element */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          pointerEvents: "none",
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: COLORS.white }}>
          OPTIGRID <span style={{ color: COLORS.purpleGlow }}>/</span> DIGITAL TWIN
        </div>
        <div style={{ fontSize: 9.5, letterSpacing: 1, color: COLORS.textDim, marginTop: 2, textTransform: "uppercase" }}>
          Facility {facilityContext.facilityId} · {facilityContext.discom} ·{" "}
          <span style={{ color: COLORS.energyCyan }}>● LIVE</span>
        </div>
      </div>

      {approvalStatus !== "PENDING" && (
        <div
          style={{
            position: "absolute",
            top: 52,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "6px 16px",
            borderRadius: 999,
            background: approvalStatus === "APPROVED" ? "rgba(103,232,249,0.12)" : "rgba(139,152,165,0.12)",
            border: `1px solid ${approvalStatus === "APPROVED" ? COLORS.energyCyan : "#8b98a5"}`,
            color: approvalStatus === "APPROVED" ? COLORS.energyCyan : "#c8d0d8",
            fontFamily: "'Segoe UI', system-ui, sans-serif",
            fontSize: 11.5,
            fontWeight: 700,
            letterSpacing: 0.4,
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
      <FacilityViewControl viewMode={viewMode} onChange={setViewMode} />
      <Inspector
        zone={selectedZone}
        value={selectedMetrics?.value ?? 0}
        ratio={selectedMetrics?.ratio ?? 0}
        spike={selectedMetrics?.spike ?? false}
        totalLoad={current.total_kw}
        onClose={() => setSelectedZoneId(null)}
      />

      <RecommendationBadge recommendation={RECOMMENDATION} approvalStatus={approvalStatus} onOpen={() => setRecOpen(true)} />
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

      <TimeSlider timeline={BASELINE_TIMELINE} index={index} onChange={handleIndexChange} />
    </div>
  );
}
