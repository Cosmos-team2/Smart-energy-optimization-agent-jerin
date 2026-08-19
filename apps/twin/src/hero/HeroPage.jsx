import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";

import CameraRig from "./CameraRig.jsx";
import FacilityScene from "./scene/FacilityScene.jsx";
import HeroOverlay from "./HeroOverlay.jsx";
import { COLORS } from "./palette.js";
import { STORY_STEPS, frameForPhase } from "./story.js";
import { FOCUS_PRESETS } from "./scene/layout.js";

import PlatformSection from "../sections/PlatformSection.jsx";
import SolutionsSection from "../sections/SolutionsSection.jsx";
import ResourcesSection from "../sections/ResourcesSection.jsx";
import AboutSection from "../sections/AboutSection.jsx";
import PricingSection from "../sections/PricingSection.jsx";
import FinalCTA from "../sections/FinalCTA.jsx";

import DemoModal from "../components/DemoModal.jsx";
import SignInModal from "../components/SignInModal.jsx";
import HowItWorksModal from "../components/HowItWorksModal.jsx";

const NAV_SECTIONS = ["platform", "solutions", "resources", "about", "pricing"];

export default function HeroPage() {
  const [stepIdx, setStepIdx] = useState(0);
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const timeoutRef = useRef(null);

  const [demoOpen, setDemoOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);

  // Story cycle: normal → peak → transition → optimized → loop
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

  function scrollToSection(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div style={{ width: "100%", background: COLORS.bg }}>
      {/* ── HERO — full viewport, 3D facility + overlay ─────────────────── */}
      <section style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden" }}>
        {/* Subtle radial purple background glow — CSS, behind canvas */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse 70% 55% at 65% 52%, rgba(88,28,220,0.07) 0%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <Canvas
          style={{ width: "100%", height: "100%", position: "absolute", inset: 0, zIndex: 1 }}
          camera={{ position: [5.5, 11.5, 18.5], fov: 44, near: 0.1, far: 220 }}
          onPointerMissed={() => setSelectedId(null)}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
            toneMappingExposure: 1.45,
          }}
          shadows
        >
          <color attach="background" args={[COLORS.bg]} />
          <fog attach="fog" args={[COLORS.fog, 24, 72]} />

          <ambientLight intensity={0.55} color="#3a3560" />
          <directionalLight
            position={[14, 22, 8]}
            intensity={1.7}
            color="#e4eeff"
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <directionalLight position={[-12, 10, -14]} intensity={0.7} color="#9061f9" />
          <directionalLight position={[18, 8, -6]} intensity={0.65} color="#c0b8ff" />
          <hemisphereLight args={["#241f4a", "#0c0a18", 0.8]} />
          <pointLight position={[0, 14, 0]} color="#8b5cf6" intensity={1.1} distance={45} decay={2} />

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

        <div style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none" }}>
          <HeroOverlay
            phase={phase}
            onNavClick={scrollToSection}
            onOpenSignIn={() => setSignInOpen(true)}
            onOpenDemo={() => setDemoOpen(true)}
            onOpenHowItWorks={() => setHowItWorksOpen(true)}
          />
        </div>
      </section>

      {/* ── Sections below the hero — this is what the navbar links to ──── */}
      <PlatformSection />
      <SolutionsSection />
      <ResourcesSection />
      <AboutSection />
      <PricingSection onOpenDemo={() => setDemoOpen(true)} />
      <FinalCTA />

      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
      <HowItWorksModal open={howItWorksOpen} onClose={() => setHowItWorksOpen(false)} />
    </div>
  );
}
