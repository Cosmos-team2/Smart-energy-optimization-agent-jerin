import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";

import CameraRig from "./CameraRig.jsx";
import FacilityScene from "./scene/FacilityScene.jsx";
import HeroOverlay from "./HeroOverlay.jsx";
import { COLORS } from "./palette.js";
import { STORY_STEPS, frameForPhase } from "./story.js";
import { FOCUS_PRESETS } from "./scene/layout.js";

export default function HeroPage() {
  const [stepIdx, setStepIdx] = useState(0);
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const step = STORY_STEPS[stepIdx];
    timeoutRef.current = setTimeout(() => {
      setStepIdx((i) => (i + 1) % STORY_STEPS.length);
    }, step.holdMs);
    return () => clearTimeout(timeoutRef.current);
  }, [stepIdx]);

  const phase = STORY_STEPS[stepIdx].phase;
  const current = frameForPhase(phase);
  const focus = selectedId ? FOCUS_PRESETS[selectedId] : null;

  return (
    <div style={{ position: "fixed", inset: 0, width: "100%", height: "100%", background: COLORS.bg, overflow: "hidden" }}>
      <Canvas
        style={{ width: "100%", height: "100%" }}
        camera={{ position: [9.3, 10.7, 14.4], fov: 45, near: 0.1, far: 200 }}
        onPointerMissed={() => setSelectedId(null)}
      >
        <color attach="background" args={[COLORS.bg]} />
        <fog attach="fog" args={[COLORS.fog, 20, 62]} />

        <ambientLight intensity={0.36} color="#2a3a44" />
        <directionalLight position={[14, 22, 8]} intensity={1.05} color="#bfe8ff" />
        <directionalLight position={[-10, 8, -12]} intensity={0.4} color={COLORS.energyCyan} />
        <hemisphereLight args={["#0e1a20", "#05070a", 0.5]} />

        <CameraRig focus={focus} paused={Boolean(hoveredId || selectedId)} />
        <FacilityScene
          phase={phase}
          current={current}
          hoveredId={hoveredId}
          selectedId={selectedId}
          onHover={setHoveredId}
          onSelect={(id) => setSelectedId((cur) => (cur === id ? null : id))}
        />
      </Canvas>

      <HeroOverlay phase={phase} />
    </div>
  );
}
