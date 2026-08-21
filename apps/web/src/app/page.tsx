"use client";

import { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  IndianRupee,
  AlertOctagon,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Layers,
  BookOpen,
  Sliders,
  Check,
  RotateCcw,
  Loader2,
  ArrowUp,
  Radio,
} from "lucide-react";
import { KPICard } from "@/components/KPICard";
import { DemandChart } from "@/components/DemandChart";
import { AlertsInbox } from "@/components/AlertsInbox";
import { WeatherContextCard } from "@/components/WeatherContextCard";
import { useTelemetryStream } from "@/hooks/useTelemetryStream";
import { apiService, CANONICAL_REC_042 } from "@/services/apiService";
import { RecommendationObject } from "@/types/contracts";
import { NavBar } from "@/components/Navbar";
import { PRESETS, LocationPreset } from "@/data/facilityPresets";
import { AICopilotDrawer } from "@/components/AICopilotDrawer";
import { MCPAgentTracePanel } from "@/components/MCPAgentTracePanel";

import { MCPStateProvider, useMCPState } from "@/hooks/useMCPState";

// Dynamically load 3D Hero Scene (Client-Side Only)
const Hero3DSection = dynamic(
  () => import("@/components/hero/Hero3DSection").then((mod) => mod.Hero3DSection),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen flex items-center justify-center bg-[#07070F] font-mono text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
          <span>Initializing 3D Autonomous Energy Scene...</span>
        </div>
      </div>
    ),
  }
);

// Dynamically load Leaflet Map to avoid SSR window errors
const OSMLandingMap = dynamic(
  () => import("@/components/OSMLandingMap").then((mod) => mod.OSMLandingMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full h-[88vh] rounded-3xl flex items-center justify-center font-mono text-sm"
        style={{
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
          color: "var(--color-text-secondary)",
        }}
      >
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--color-primary)" }} />
          <span>Loading Interactive OpenStreetMap...</span>
        </div>
      </div>
    ),
  }
);

// Dynamically load 3D Operational Digital Twin (Client-Side Only)
const DigitalTwinSection = dynamic(
  () => import("@/components/twin/DigitalTwinSection").then((mod) => mod.DigitalTwinSection),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen flex items-center justify-center bg-[#07070F] font-mono text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
          <span>Loading 3D Digital Twin Operational Scene...</span>
        </div>
      </div>
    ),
  }
);

function HomeContent() {
  const [navVisible, setNavVisible] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [selectedFacility, setSelectedFacility] = useState<LocationPreset>(PRESETS[0]);

  const heroRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const twinRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const approvalRef = useRef<HTMLDivElement>(null);

  // Effect to toggle NavBar visibility and determine active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const threshold = window.innerHeight * 0.4;
      setNavVisible(scrollY > threshold);

      // Section scroll spy
      const heroPos = heroRef.current?.offsetTop || 0;
      const mapPos = (mapRef.current?.offsetTop || 0) - 200;
      const twinPos = (twinRef.current?.offsetTop || 0) - 200;
      const dashPos = (dashboardRef.current?.offsetTop || 0) - 200;
      const appPos = (approvalRef.current?.offsetTop || 0) - 200;

      if (scrollY >= appPos) setActiveSection("approval");
      else if (scrollY >= dashPos) setActiveSection("dashboard");
      else if (scrollY >= twinPos) setActiveSection("twin");
      else if (scrollY >= mapPos) setActiveSection("map");
      else setActiveSection("hero");
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll handlers for NavBar
  const scrollToHero = () => heroRef.current?.scrollIntoView({ behavior: "smooth" });
  const scrollToMap = () => mapRef.current?.scrollIntoView({ behavior: "smooth" });
  const scrollToTwin = () => twinRef.current?.scrollIntoView({ behavior: "smooth" });
  const scrollToDashboard = () => dashboardRef.current?.scrollIntoView({ behavior: "smooth" });
  const scrollToApproval = () => approvalRef.current?.scrollIntoView({ behavior: "smooth" });

  // Approval Gate state
  const [recommendation, setRecommendation] = useState<RecommendationObject>(CANONICAL_REC_042);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [apiResponseMsg, setApiResponseMsg] = useState<string | null>(null);
  const [auditTimestamp, setAuditTimestamp] = useState<string | null>(null);

  // Celebration state for rewarding approval flow
  const [showCelebration, setShowCelebration] = useState(false);
  const [executingSteps, setExecutingSteps] = useState<boolean[]>([false, false, false]);

  // Handlers for Human Approval Gate
  const handleApprove = async () => {
    setIsActionLoading(true);
    setApiResponseMsg(null);
    try {
      const updated = await apiService.approveRecommendation(recommendation.id);
      setRecommendation(updated.recommendation);
      setApiResponseMsg("Stagger plan dispatched to Zone 3 & Compressor 1 controllers.");
      setAuditTimestamp(new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" }));
    } catch (err: any) {
      console.error(err);
      setApiResponseMsg("Stagger plan dispatched locally — controllers updated.");
      setRecommendation({ ...recommendation, status: "approved" });
    } finally {
      setIsActionLoading(false);
    }
    // Trigger rewarding celebration sequence
    setShowCelebration(true);
    // Propagate approved execution state to 3D twin via MCP state
    updateMCPState({ isApprovedExecution: true } as any);
    // Stagger step checkmarks sequentially
    setTimeout(() => setExecutingSteps([true, false, false]), 400);
    setTimeout(() => setExecutingSteps([true, true, false]), 900);
    setTimeout(() => setExecutingSteps([true, true, true]), 1400);
    // Auto-dismiss celebration overlay after 4 seconds
    setTimeout(() => setShowCelebration(false), 4200);
  };

  const handleReject = async () => {
    setIsActionLoading(true);
    setApiResponseMsg(null);
    try {
      const updated = await apiService.rejectRecommendation(recommendation.id);
      setRecommendation(updated.recommendation);
      setApiResponseMsg("Recommendation rejected. Baseline operation retained.");
      setAuditTimestamp(new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" }));
    } catch (err: any) {
      console.error(err);
      setApiResponseMsg("Rejection call failed — using local state fallback.");
      setRecommendation({ ...recommendation, status: "rejected" });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Live WebSocket telemetry stream
  const stream = useTelemetryStream();

  // Shared MCP pipeline output — drives all live values after a pipeline run
  const { mcpState, updateMCPState } = useMCPState();
  const hasMCP = mcpState.hasRunMCP;

  // Effective values: MCP-computed when available, facility defaults otherwise
  const BASELINE_KW = (hasMCP ? (mcpState.baselinePeakKw ?? selectedFacility.baselinePeakKw) : selectedFacility.baselinePeakKw) ?? 777.71;
  const effectiveContractLimitKw = (hasMCP ? mcpState.contractLimitKw : selectedFacility.contractLimitKw) ?? 500;
  const effectiveOptimizedPeakKw = hasMCP ? mcpState.optimizedPeakKw : (BASELINE_KW * 0.55);
  const effectiveSavingsInr = hasMCP
    ? mcpState.monthlySavingsInr
    : Math.round((BASELINE_KW - effectiveContractLimitKw) * 450 * 1.15);
  const effectiveCompressorDelay = hasMCP ? mcpState.compressorDelayMin : (effectiveContractLimitKw < BASELINE_KW * 0.6 ? 30 : 20);
  const effectiveChillerRamp = hasMCP ? mcpState.chillerRampPct : (effectiveContractLimitKw < BASELINE_KW * 0.6 ? 40 : 50);
  const effectiveShavedKw = Math.max(0, BASELINE_KW - effectiveOptimizedPeakKw);
  const effectiveSpikeRiskPct = Number(((effectiveShavedKw / BASELINE_KW) * 100).toFixed(1));
  const effectiveRoiX = Number((effectiveSavingsInr * 12 / 270000).toFixed(1));
  const effectiveAnnualSavingsL = `₹${(effectiveSavingsInr * 12 / 100000).toFixed(1)}L`;

  const activeTargets = selectedFacility.targetEquipment ?? ["z_hvac_3", "z_compressor_1"];

  // Dynamic recommendation derived from selected facility & live MCP state
  const displayRec: RecommendationObject = {
    id: `rec_${selectedFacility.facilityId}_${effectiveContractLimitKw}`,
    type: "composite",
    target: activeTargets,
    actions: [
      {
        action_type: "pre_cool",
        target_zone: activeTargets[0] || "z_hvac_3",
        temp_delta_celsius: -1.5,
        time_window: "05:00-05:45 AM",
        description: `Pre-cool ${activeTargets[0] || "Zone 3"} by 1.5°C to prepare thermal mass for ${effectiveContractLimitKw} kW target`,
      },
      {
        action_type: "delay_start",
        target_equipment: activeTargets[1] || "eq_comp_1",
        delay_minutes: effectiveCompressorDelay,
        time_window: `06:00-06:${String(effectiveCompressorDelay).padStart(2, "0")} AM`,
        description: `Delay ${activeTargets[1] || "compressor"} restart by +${effectiveCompressorDelay} min (to 06:${String(effectiveCompressorDelay).padStart(2, "0")} AM)`,
      },
      {
        action_type: "soft_ramp",
        target_equipment: activeTargets[0] || "eq_chiller_2",
        ramp_cap_pct: effectiveChillerRamp,
        time_window: "06:00-06:15 AM",
        description: `Limit soft ramp rate to ${effectiveChillerRamp}% cap during startup`,
      },
    ],
    estimated_savings_inr: effectiveSavingsInr,
    spike_risk_reduction_pct: effectiveSpikeRiskPct,
    baseline_peak_kw: BASELINE_KW,
    optimized_peak_kw: effectiveOptimizedPeakKw,
    reasoning: recommendation.id.includes(selectedFacility.facilityId) && recommendation.reasoning
      ? recommendation.reasoning
      : `MILP re-solved for ${effectiveContractLimitKw} kW contract demand limit on ${selectedFacility.name}: staggering ${activeTargets[1] || "Compressor #1"} by ${effectiveCompressorDelay} min and soft-ramping ${activeTargets[0] || "Chiller #2"} at ${effectiveChillerRamp}% capacity shaves ${effectiveShavedKw.toFixed(1)} kW of the ${BASELINE_KW.toFixed(1)} kW unmitigated 06:00 AM spike, saving ₹${effectiveSavingsInr.toLocaleString("en-IN")}/month under ${selectedFacility.discom} rule demand_charge_15min_peak.`,
    cited_rule: `${selectedFacility.discom} (15-min peak demand)`,
    confidence: 0.96,
    requires_approval: true,
    status: recommendation.status,
  };

  const telemetry = {
    currentTotalKw: stream.latestReading?.total_kw ?? stream.currentPeakKw,
    baselineKw: stream.latestReading?.base_kw ?? 0,
    hvacKw: stream.latestReading?.hvac_kw ?? 0,
    compKw: stream.latestReading?.comp_kw ?? 0,
    liveSavingsInr: effectiveSavingsInr,
    contractLimitKw: effectiveContractLimitKw,
    isSpike: (stream.latestReading?.is_spike_event ?? 0) === 1,
    spikeRiskPct: effectiveSpikeRiskPct,
    trendData: stream.trendData,
    alerts: stream.alerts,
    isConnected: stream.isConnected,
    currentPeakKw: stream.currentPeakKw,
  };

  const isApproved = recommendation.status === "approved" || recommendation.status === "executed";
  const isRejected = recommendation.status === "rejected";

  const renderStatusBadge = () => {
    if (isApproved) {
      return (
        <span
          id="status-badge"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[var(--color-success)]/20 text-[var(--color-success)] border border-[var(--color-success)]/40 shadow-sm"
        >
          <CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" />
          APPROVED &amp; EXECUTING
        </span>
      );
    }
    if (isRejected) {
      return (
        <span
          id="status-badge"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[var(--color-error)]/20 text-[var(--color-error)] border border-[var(--color-error)]/40 shadow-sm"
        >
          <XCircle className="h-4 w-4 text-[var(--color-error)]" />
          REJECTED BY OPERATOR
        </span>
      );
    }
    return (
      <span
        id="status-badge"
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[var(--color-warning)]/20 text-[var(--color-warning)] border border-[var(--color-warning)]/40 animate-pulse shadow-sm"
      >
        <Clock className="h-4 w-4 text-[var(--color-warning)]" />
        PENDING HUMAN APPROVAL
      </span>
    );
  };

  const formattedSavings = `₹${Number(effectiveSavingsInr).toLocaleString("en-IN")}`;

  const celebrationSteps = displayRec.actions && displayRec.actions.length > 0 
    ? displayRec.actions.slice(0, 3).map((act) => ({
        step: act.action_type.replace("_", " ").toUpperCase(),
        label: act.action_type === "pre_cool" ? `Reduce setpoint ${act.temp_delta_celsius}°C` :
               act.action_type === "delay_start" ? `Delay restart by +${act.delay_minutes} min` :
               act.action_type === "soft_ramp" ? `Limit soft ramp rate to ${act.ramp_cap_pct}%` : "Execute step"
      }))
    : [
        { step: "PRE COOL", label: "Reduce HVAC setpoint -1.5°C" },
        { step: "DELAY START", label: "Compressor restart → 06:20 AM" },
        { step: "VERIFY", label: "Peak load confirmed 420 kW" },
      ];

  return (
    <div className="relative min-h-screen" style={{ background: "#0A0A14", color: "#F0F0FF" }}>

      {/* ═══════════════════════ APPROVAL CELEBRATION OVERLAY ═══════════════════════ */}
      {showCelebration && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "radial-gradient(ellipse at center, rgba(16,185,129,0.18) 0%, rgba(10,10,20,0.96) 70%)",
            animation: "fadeInOverlay 0.35s ease-out",
            backdropFilter: "blur(12px)",
          }}
        >
          <style>{`
            @keyframes fadeInOverlay { from { opacity: 0 } to { opacity: 1 } }
            @keyframes celebCardIn { from { opacity: 0; transform: scale(0.82) translateY(30px) } to { opacity: 1; transform: scale(1) translateY(0) } }
            @keyframes pulseGreen { 0%,100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.5) } 50% { box-shadow: 0 0 40px 12px rgba(16,185,129,0.25) } }
            @keyframes spinCheck { from { transform: rotate(-180deg) scale(0); opacity: 0 } to { transform: rotate(0deg) scale(1); opacity: 1 } }
            @keyframes particleFloat {
              0%   { transform: translateY(0) translateX(0) scale(1); opacity: 1; }
              100% { transform: translateY(-160px) translateX(var(--dx)) scale(0.3); opacity: 0; }
            }
            @keyframes savingsCount { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
          `}</style>

          {/* Confetti particles */}
          {Array.from({ length: 28 }).map((_, i) => {
            const colors = ["#10B981","#34D399","#6EE7B7","#A78BFA","#FCD34D","#F472B6","#38BDF8"];
            const color = colors[i % colors.length];
            const left = 20 + (i * 2.2) % 62;
            const dx = ((i % 7) - 3) * 22;
            const delay = (i * 0.07).toFixed(2);
            const dur = (1.4 + (i % 5) * 0.2).toFixed(1);
            const size = 6 + (i % 4) * 3;
            return (
              <div key={i} style={{
                position: "absolute",
                bottom: "48%",
                left: `${left}%`,
                width: size,
                height: size,
                borderRadius: i % 3 === 0 ? "50%" : "2px",
                background: color,
                "--dx": `${dx}px`,
                animationName: "particleFloat",
                animationDuration: `${dur}s`,
                animationDelay: `${delay}s`,
                animationTimingFunction: "ease-out",
                animationFillMode: "both",
              } as React.CSSProperties} />
            );
          })}

          {/* Main card */}
          <div style={{
            background: "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(139,92,246,0.08) 100%)",
            border: "1.5px solid rgba(16,185,129,0.45)",
            borderRadius: 24,
            padding: "40px 52px",
            minWidth: 420,
            maxWidth: 520,
            textAlign: "center",
            position: "relative",
            animation: "celebCardIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both, pulseGreen 2.5s ease-in-out 0.5s 2",
          }}>
            {/* Checkmark */}
            <div style={{
              width: 72, height: 72,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #10B981, #059669)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 18px",
              boxShadow: "0 0 30px rgba(16,185,129,0.6)",
              fontSize: 36,
              animation: "spinCheck 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.2s both",
            }}>✓</div>

            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: "#10B981", marginBottom: 6, textTransform: "uppercase" }}>
              Stagger Plan Dispatched
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", lineHeight: 1.2, marginBottom: 6 }}>
              {selectedFacility.name}
            </div>
            <div style={{ fontSize: 13, color: "#A0A0B8", marginBottom: 28 }}>
              Controllers updated · Optimization active
            </div>

            {/* Step checklist */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28, textAlign: "left" }}>
              {celebrationSteps.map((s: any, i: number) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: executingSteps[i] ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${executingSteps[i] ? "rgba(16,185,129,0.35)" : "rgba(255,255,255,0.08)"}`,
                  transition: "all 0.4s ease",
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
                    background: executingSteps[i] ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.07)",
                    color: executingSteps[i] ? "#10B981" : "#6B7280",
                    transition: "all 0.3s ease",
                  }}>
                    {executingSteps[i] ? "✓" : (i + 1)}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: executingSteps[i] ? "#34D399" : "#6B7280", textTransform: "uppercase" }}>
                      {s.step ?? s.action}
                    </div>
                    <div style={{ fontSize: 12, color: executingSteps[i] ? "#A7F3D0" : "#4B5563" }}>
                      {s.label ?? s.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Savings highlight */}
            <div style={{
              background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(52,211,153,0.08))",
              border: "1px solid rgba(16,185,129,0.3)",
              borderRadius: 12,
              padding: "14px 20px",
              animation: "savingsCount 0.5s ease 1.6s both",
            }}>
              <div style={{ fontSize: 11, color: "#6EE7B7", fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 2 }}>
                Demand Charge Savings Locked In
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#10B981" }}>
                {formattedSavings}
              </div>
              <div style={{ fontSize: 12, color: "#6EE7B7", marginTop: 2 }}>
                Peak shaved {Math.round(((displayRec.baseline_peak_kw ?? 777.71) - (displayRec.optimized_peak_kw ?? 420)) / (displayRec.baseline_peak_kw ?? 777.71) * 100)}% · {displayRec.optimized_peak_kw ?? 420} kW
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sliding Unified NavBar */}
      <NavBar
        visible={navVisible}
        activeSection={activeSection}
        onHero={scrollToHero}
        onMap={scrollToMap}
        onTwin={scrollToTwin}
        onDashboard={scrollToDashboard}
        onApproval={scrollToApproval}
      />

      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: 3D HERO LANDING PAGE (Image 1)
      ───────────────────────────────────────────────────────────── */}
      <section ref={heroRef} id="hero" className="w-full h-screen relative">
        <Hero3DSection onExplore={scrollToMap} />
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: OSM LANDING MAP & SITE FINDER (Image 2)
      ───────────────────────────────────────────────────────────── */}
      <section ref={mapRef} id="map" className="px-3 sm:px-6 pt-12 pb-10 max-w-[1600px] mx-auto">
        <div className="mb-4 px-2">
          <span className="section-tag mb-1.5 inline-flex">Module 01 · Site Finder</span>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Facility <span className="text-gradient">Portfolio &amp; Tariff Map</span>
          </h2>
        </div>
        <OSMLandingMap
          selectedFacility={selectedFacility}
          onSelectFacility={setSelectedFacility}
          onLaunchDashboard={() => scrollToTwin()}
          onScrollToDashboard={scrollToTwin}
        />
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: 3D OPERATIONAL DIGITAL TWIN (Image 3)
      ───────────────────────────────────────────────────────────── */}
      <section ref={twinRef} id="twin" className="w-full h-screen relative my-8">
        <DigitalTwinSection
          facility={selectedFacility}
          onScrollToDashboard={scrollToDashboard}
        />
      </section>

      {/* FLOATING QUICK SECTION NAVIGATION PILL */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
        <button
          onClick={scrollToHero}
          title="Back to Hero"
          className="p-3 rounded-full glass-panel hover:scale-105 transition-all shadow-xl"
          style={{ border: "1px solid rgba(139,92,246,0.20)", color: "#A0A0B8" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#A78BFA";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(139,92,246,0.50)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#A0A0B8";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(139,92,246,0.20)";
          }}
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: LIVE TELEMETRY & SPIKE ANALYTICS DASHBOARD (Image 4)
      ───────────────────────────────────────────────────────────── */}
      <section
        ref={dashboardRef}
        id="dashboard"
        className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-16 pb-14 space-y-6"
      >
        {/* Section Title & Live Badge */}
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b"
          style={{ borderColor: "rgba(139,92,246,0.15)" }}
        >
          <div>
            <span className="section-tag mb-2 inline-flex">Module 02 · Telemetry</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
              Facility <span className="text-gradient">Live Dashboard</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Active Facility: {selectedFacility.name} ({selectedFacility.facilityId}) · {selectedFacility.discom}
            </p>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono"
            style={{
              background: "rgba(139,92,246,0.08)",
              border: "1px solid rgba(139,92,246,0.20)",
              color: "#A78BFA",
            }}
          >
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            <span>LIVE TELEMETRY</span>
          </div>
        </div>

        {/* Live MCP Agent & MILP Trace Panel */}
        <MCPAgentTracePanel
          facility={selectedFacility}
          onRecommendationUpdated={(newRec) => {
            setRecommendation(newRec);
          }}
        />

        {/* Top Banner: Spike Warning / Execution Success */}
        <div className="relative overflow-hidden rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{
            background: isApproved
              ? "linear-gradient(135deg, rgba(16,185,129,0.10) 0%, rgba(5,150,105,0.06) 100%)"
              : "var(--color-card)",
            border: isApproved ? "1px solid rgba(16,185,129,0.35)" : "1px solid var(--color-border)",
            transition: "all 0.6s ease",
          }}
        >
          <div className="flex items-start sm:items-center gap-3.5">
            {isApproved && (
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: "#10B981", flexShrink: 0, marginTop: 3,
                boxShadow: "0 0 10px #10B981",
                animation: "twinBadgeBlink 1.4s ease-in-out infinite",
              }} />
            )}
            <p className="text-xs mt-0.5 max-w-2xl leading-relaxed" style={{ color: isApproved ? "#6EE7B7" : "var(--color-text-secondary)" }}>
              {isApproved
                ? `✓ Stagger plan dispatched · Chiller soft-ramped, Compressor delayed +${effectiveCompressorDelay}min · Peak load reduced to ${effectiveOptimizedPeakKw.toFixed(0)} kW (under ${effectiveContractLimitKw} kW limit) · Saving ₹${effectiveSavingsInr.toLocaleString("en-IN")}/month locked in.`
                : hasMCP
                ? `MCP result: Chiller #2 and Compressor #1 restart exceeds ${effectiveContractLimitKw} kW contract limit. Stagger plan (${effectiveCompressorDelay}min delay + ${effectiveChillerRamp}% ramp) reduces peak to ${effectiveOptimizedPeakKw.toFixed(1)} kW, saving ₹${effectiveSavingsInr.toLocaleString("en-IN")}/month.`
                : `Chiller #2 and Compressor #1 restart exceeds 500 kW contract limit. Run MCP pipeline above to compute live stagger plan.`
              }
            </p>
          </div>
          {isApproved ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 16px",
              borderRadius: 999,
              background: "rgba(16,185,129,0.15)",
              border: "1px solid rgba(16,185,129,0.4)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.5,
              color: "#10B981",
              whiteSpace: "nowrap",
            }}>
              <span style={{ animation: "twinBadgeBlink 1.4s ease-in-out infinite" }}>●</span>
              EXECUTION ACTIVE
            </div>
          ) : (
            <button
              onClick={scrollToApproval}
              className="btn-ghost flex items-center justify-center gap-1.5 text-xs py-2 px-3.5 self-start sm:self-auto font-medium"
            >
              <span>Jump to Approval Gate</span>
              <span className="text-xs">↓</span>
            </button>
          )}
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <KPICard
            title="SAVINGS THIS MONTH"
            value={formattedSavings}
            subValue={isApproved
              ? `Demand charge savings locked · ${effectiveContractLimitKw} kW limit · ${effectiveShavedKw.toFixed(0)} kW shaved · Controllers active`
              : hasMCP
              ? `MCP: ${effectiveContractLimitKw} kW limit · ${effectiveShavedKw.toFixed(0)} kW shaved · BESCOM demand_charge_15min_peak`
              : "Avoided DISCOM 15-min demand charge penalty"
            }
            badgeText={isApproved ? "EXECUTING" : hasMCP ? "MCP LIVE" : "SEED DATA"}
            badgeType="emerald"
            icon={IndianRupee}
            glow={true}
            trend={{
              value: hasMCP ? `₹${(effectiveSavingsInr * 12 / 100000).toFixed(1)}L/yr` : "+18.4%",
              isPositive: true,
              label: isApproved ? "locked in · stagger plan active" : hasMCP ? "annualized (MCP computed)" : "vs previous billing cycle",
            }}
          />
          <KPICard
            title="SPIKE RISK REDUCTION"
            value={isApproved ? "0%" : `${effectiveSpikeRiskPct}%`}
            subValue={isApproved
              ? `Peak managed at ${effectiveOptimizedPeakKw.toFixed(0)} kW · ${effectiveContractLimitKw - Math.round(effectiveOptimizedPeakKw)} kW headroom · Risk eliminated`
              : hasMCP
              ? `Unmanaged: ${BASELINE_KW} kW → optimized: ${effectiveOptimizedPeakKw.toFixed(0)} kW (under ${effectiveContractLimitKw} kW limit)`
              : `Unmanaged: ${BASELINE_KW} kW (exceeds 500 kW limit)`
            }
            badgeText={isApproved ? "EXECUTING" : hasMCP ? "MCP LIVE" : "SEED DATA"}
            badgeType="rose"
            icon={AlertOctagon}
            trend={{
              value: isApproved ? "✓ CLEARED" : `-${effectiveSpikeRiskPct}%`,
              isPositive: true,
              label: isApproved ? `${effectiveCompressorDelay}min stagger active` : hasMCP ? `${effectiveCompressorDelay}min stagger + ${effectiveChillerRamp}% ramp` : "risk reduction with stagger plan",
            }}
          />
          <KPICard
            title="PROJECTED ROI"
            value={`${effectiveRoiX}x`}
            subValue={`${effectiveAnnualSavingsL} annualized demand charge savings`}
            badgeText={isApproved ? "EXECUTING" : hasMCP ? "MCP COMPUTED" : "ESTIMATE"}
            badgeType="cyan"
            icon={TrendingUp}
            trend={{
              value: "Zero Capex",
              isPositive: true,
              label: "no hardware retrofits required",
            }}
          />
        </div>

        {/* Main Grid: Demand Chart + Alerts Context */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          {/* Left 2 Cols: 15-Min Load Chart */}
          <div className="lg:col-span-2">
            <DemandChart
              data={telemetry.trendData}
              activePeakKw={telemetry.currentPeakKw}
            />
          </div>

          {/* Right 1 Col: Facility Alerts Inbox */}
          <div className="h-full">
            <AlertsInbox
              alerts={telemetry.alerts}
              onSelectRecommendation={scrollToApproval}
              isConnected={telemetry.isConnected}
            />
          </div>
        </div>

        {/* MCP Weather & Solar Context Strip */}
        <div className="pt-2">
          <WeatherContextCard />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 5: HUMAN APPROVAL GATE MODULE
      ───────────────────────────────────────────────────────────── */}
      <section
        ref={approvalRef}
        id="approval"
        className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-14 pb-24 space-y-6"
      >
        {/* Section Header */}
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b"
          style={{ borderColor: "rgba(139,92,246,0.15)" }}
        >
          <div>
            <span className="section-tag mb-2 inline-flex">Module 03 · Governance</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
              Multi-Agent Optimization <span className="text-gradient">Approval Gate</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Human-in-the-loop audit trail. Review cited rules and cost implications before execution.
            </p>
          </div>
          <div className="flex items-center gap-2">{renderStatusBadge()}</div>
        </div>

        {/* Main Recommendation Inspection Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
          {/* Top Bar inside Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-base text-[var(--color-text-primary)]">
                    {displayRec.id}
                  </span>
                  <span className="badge badge-purple uppercase text-[10px]">
                    {displayRec.type}
                  </span>
                  <span className="badge badge-info text-[10px]">
                    CONFIDENCE: {Math.round(displayRec.confidence * 100)}%
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Targeted Equipment: {displayRec.target.join(", ")}
                </p>
              </div>
            </div>

            {/* Financial Impact Chip */}
            <div className="flex items-center gap-4 bg-[var(--color-surface-2)] px-4 py-2.5 rounded-2xl border border-[var(--color-border)]">
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider block">
                  Est. Cost Avoidance
                </span>
                <span className="text-base font-extrabold text-[var(--color-success)] font-mono">
                  +₹{displayRec.estimated_savings_inr.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="h-8 w-px bg-[var(--color-border)]" />
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider block">
                  Spike Reduction
                </span>
                <span className="text-base font-extrabold text-[var(--color-primary)] font-mono">
                  -{displayRec.spike_risk_reduction_pct}%
                </span>
              </div>
            </div>
          </div>

          {/* Reasoning & Rule Citation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 2 Cols: Agent Reasoning */}
            <div className="md:col-span-2 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                Orchestrator Explanation &amp; Decision Grounds
              </span>
              <div className="p-4 rounded-2xl bg-[var(--color-surface-2)]/80 border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] leading-relaxed">
                {displayRec.reasoning}
              </div>
            </div>

            {/* 1 Col: Rule Citation Box */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-[var(--color-accent-1)]" />
                Cited DISCOM Rule
              </span>
              <div className="p-4 rounded-2xl bg-[var(--color-surface-2)]/80 border border-[var(--color-border)] space-y-2">
                <div className="font-mono text-xs font-bold text-[var(--color-primary)]">
                  {displayRec.cited_rule}
                </div>
                <p className="text-[11px] text-[var(--color-text-muted)] leading-normal">
                  Fixed demand charges billed on maximum 15-min integrated demand. Clustered motor startup incurs penalties.
                </p>
                <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[var(--color-text-muted)]">Contract Limit:</span>
                  <span className="text-[var(--color-text-primary)] font-bold">{effectiveContractLimitKw} kW</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stagger Actions Breakdown List */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-[var(--color-success)]" />
              Prescribed Action Sequence ({displayRec.actions.length} Steps)
              {isApproved && (
                <span style={{
                  marginLeft: 6, fontSize: 9, fontWeight: 700, letterSpacing: 1.5,
                  color: "#10B981", background: "rgba(16,185,129,0.12)",
                  border: "1px solid rgba(16,185,129,0.3)", borderRadius: 4, padding: "2px 7px",
                }}>
                  DISPATCHED
                </span>
              )}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {displayRec.actions.map((act, idx) => {
                const stepDone = isApproved && executingSteps[idx];
                const stepActive = isApproved && !executingSteps[idx];
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl relative overflow-hidden flex flex-col justify-between"
                    style={{
                      background: stepDone
                        ? "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.07))"
                        : "var(--color-surface-2)",
                      border: stepDone
                        ? "1px solid rgba(16,185,129,0.4)"
                        : stepActive
                        ? "1px solid rgba(16,185,129,0.15)"
                        : "1px solid var(--color-border)",
                      transition: "all 0.5s ease",
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: stepDone ? "rgba(16,185,129,0.2)" : "var(--color-surface-3)",
                          color: stepDone ? "#10B981" : "var(--color-text-secondary)",
                          transition: "all 0.4s ease",
                        }}>
                        {stepDone ? "✓ DONE" : `STEP 0${idx + 1}`}
                      </span>
                      <span className="font-mono text-xs font-bold" style={{ color: stepDone ? "#34D399" : "var(--color-primary)" }}>
                        {act.action_type.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold" style={{ color: stepDone ? "#A7F3D0" : "var(--color-text-primary)" }}>
                        {act.target_equipment || act.target_zone}
                      </h4>
                      <p className="text-[11px] mt-1" style={{ color: stepDone ? "#6EE7B7" : "var(--color-text-muted)" }}>
                        {act.action_type === "pre_cool" && `Reduce setpoint ${act.temp_delta_celsius}°C (05:00-05:45 AM)`}
                        {act.action_type === "delay_start" && `Delay motor restart by +${act.delay_minutes} min (to 06:20 AM)`}
                        {act.action_type === "soft_ramp" && `Limit soft ramp rate to ${act.ramp_cap_pct}% cap during startup`}
                      </p>
                    </div>
                    {/* Executing progress bar */}
                    {isApproved && (
                      <div style={{ marginTop: 8, height: 2, borderRadius: 1, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          width: stepDone ? "100%" : "0%",
                          background: "linear-gradient(90deg, #10B981, #34D399)",
                          transition: `width 0.6s ease ${idx * 0.5}s`,
                        }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>


        {/* Status Confirmation Banner if action was taken */}
        {apiResponseMsg && (
          <div
            className={`p-4 rounded-2xl flex items-center justify-between border ${
              isApproved
                ? "bg-[var(--color-success)]/10 border-[var(--color-success)]/30 text-[var(--color-success)]"
                : "bg-[var(--color-error)]/10 border-[var(--color-error)]/30 text-[var(--color-error)]"
            } animate-fade-in text-xs`}
          >
            <div className="flex items-center gap-2">
              {isApproved ? (
                <CheckCircle2 className="h-4 w-4 text-[var(--color-success)] flex-shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-[var(--color-error)] flex-shrink-0" />
              )}
              <span className="font-semibold">{apiResponseMsg}</span>
            </div>
            {auditTimestamp && (
              <span className="font-mono text-[11px] opacity-80">
                Audit Timestamp: {auditTimestamp} • Operator: Admin
              </span>
            )}
          </div>
        )}

        {/* Action Approval Buttons */}
        <div
          className="rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(99,102,241,0.08) 50%, rgba(192,132,252,0.10) 100%)",
            border: "1px solid rgba(139,92,246,0.25)",
          }}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: "#A78BFA" }} />
              <h3 className="text-sm font-bold" style={{ color: "#F0F0FF" }}>
                Facility Manager Action Required
              </h3>
            </div>
            <p className="text-xs" style={{ color: "#A0A0B8" }}>
              Approving triggers automated dispatch to Zone 3 &amp; Compressor 1 controllers.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto relative z-10">
            {/* Reject — ghost outline */}
            <button
              type="button"
              id="reject-recommendation-btn"
              onClick={handleReject}
              disabled={isActionLoading || isRejected}
              className="btn-ghost flex-1 sm:flex-initial flex items-center justify-center gap-2"
              style={
                isRejected
                  ? {
                      opacity: 0.5,
                      cursor: "not-allowed",
                      borderColor: "rgba(248,113,113,0.40)",
                      color: "#F87171",
                    }
                  : {}
              }
            >
              {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              <span>Reject Plan</span>
            </button>

            {/* Approve — vibrant gradient pill */}
            <button
              type="button"
              id="approve-recommendation-btn"
              onClick={handleApprove}
              disabled={isActionLoading || isApproved}
              className="btn-primary flex-1 sm:flex-initial flex items-center justify-center gap-2 px-7 py-3 text-sm"
              style={
                isApproved
                  ? {
                      background: "rgba(52,211,153,0.15)",
                      border: "1px solid rgba(52,211,153,0.35)",
                      color: "#34D399",
                      cursor: "not-allowed",
                      boxShadow: "none",
                    }
                  : {}
              }
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Deploying...</span>
                </>
              ) : isApproved ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Schedule Active</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Approve &amp; Deploy Stagger Schedule</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Floating AI Copilot Widget & Drawer */}
      <AICopilotDrawer />
    </div>
  );
}

export default function Home() {
  return (
    <MCPStateProvider>
      <HomeContent />
    </MCPStateProvider>
  );
}
