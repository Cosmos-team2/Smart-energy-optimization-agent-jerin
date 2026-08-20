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

export default function SinglePageApp() {
  const [navVisible, setNavVisible] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [selectedFacility, setSelectedFacility] = useState<LocationPreset>(PRESETS[0]);

  const telemetry = useTelemetryStream();
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

  const scrollToHero = () => {
    heroRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToMap = () => {
    mapRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToTwin = () => {
    twinRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToDashboard = () => {
    dashboardRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToApproval = () => {
    approvalRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Approval Gate state
  const [recommendation, setRecommendation] = useState<RecommendationObject>(CANONICAL_REC_042);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [apiResponseMsg, setApiResponseMsg] = useState<string | null>(null);
  const [auditTimestamp, setAuditTimestamp] = useState<string | null>(null);

  // Handlers for Human Approval Gate
  const handleApprove = async () => {
    setIsActionLoading(true);
    setApiResponseMsg(null);
    try {
      const updated = await apiService.approveRecommendation(recommendation.id);
      setRecommendation(updated.recommendation);
      setApiResponseMsg("Recommendation approved! Optimization stagger plan is now active.");
      setAuditTimestamp(new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" }));
    } catch (err: any) {
      console.error(err);
      setRecommendation((prev) => ({ ...prev, status: "approved" }));
      setApiResponseMsg("Local fallback: Plan approved (simulated response).");
      setAuditTimestamp(new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" }));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async () => {
    setIsActionLoading(true);
    setApiResponseMsg(null);
    try {
      const updated = await apiService.rejectRecommendation(recommendation.id);
      setRecommendation(updated.recommendation);
      setApiResponseMsg("Recommendation rejected. Facility retains baseline operational profile.");
      setAuditTimestamp(new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" }));
    } catch (err: any) {
      console.error(err);
      setRecommendation((prev) => ({ ...prev, status: "rejected" }));
      setApiResponseMsg("Local fallback: Plan rejected (simulated response).");
      setAuditTimestamp(new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" }));
    } finally {
      setIsActionLoading(false);
    }
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
          REJECTED / OVERRIDDEN
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

  const formattedSavings = `₹${Number(telemetry.liveSavingsInr).toLocaleString("en-IN")}`;

  return (
    <div className="relative min-h-screen" style={{ background: "#0A0A14", color: "#F0F0FF" }}>
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
          onRecommendationUpdated={(newRec) => {
            setRecommendation(newRec);
          }}
        />

        {/* Top Banner: Spike Warning & Quick Jump to Approval */}
        <div className="relative overflow-hidden rounded-2xl glass-panel-glow p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[var(--color-border)] bg-[var(--color-card)]/90">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-[var(--color-warning)]/15 border border-[var(--color-warning)]/30 text-[var(--color-warning)] flex-shrink-0 animate-pulse">
              <AlertOctagon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] font-heading">
                  Simultaneous Startup Spike Forecast: {recommendation.id}
                </h3>
                <span className="badge badge-warning text-[10px]">
                  Spike @ 06:00 AM (777.71 kW)
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 max-w-2xl leading-relaxed">
                Chiller #2 and Compressor #1 restart exceeds 500 kW contract limit. Stagger plan reduces peak to 420.0 kW.
              </p>
            </div>
          </div>
          <button
            onClick={scrollToApproval}
            className="btn-ghost flex items-center justify-center gap-1.5 text-xs py-2 px-3.5 self-start sm:self-auto font-medium"
          >
            <span>Jump to Approval Gate</span>
            <span className="text-xs">↓</span>
          </button>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <KPICard
            title="SAVINGS THIS MONTH"
            value={formattedSavings}
            subValue="Avoided DISCOM 15-min demand charge penalty"
            badgeText="VERIFIED TARIFF"
            badgeType="emerald"
            icon={IndianRupee}
            glow={true}
            trend={{
              value: "+18.4%",
              isPositive: true,
              label: "vs previous billing cycle",
            }}
          />
          <KPICard
            title="SPIKE RISK"
            value={`${telemetry.spikeRiskPct}%`}
            subValue="Unmanaged: 777.71 kW (exceeds 500 kW limit)"
            badgeText="CRITICAL WINDOW"
            badgeType="rose"
            icon={AlertOctagon}
            trend={{
              value: "-62.5%",
              isPositive: true,
              label: "risk reduction with stagger plan",
            }}
          />
          <KPICard
            title="PROJECTED ROI"
            value="4.8x"
            subValue="₹15.6L annualized demand charge savings"
            badgeText="1.8 MO PAYBACK"
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
                    {recommendation.id}
                  </span>
                  <span className="badge badge-purple uppercase text-[10px]">
                    {recommendation.type}
                  </span>
                  <span className="badge badge-info text-[10px]">
                    CONFIDENCE: {Math.round(recommendation.confidence * 100)}%
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Targeted Equipment: {recommendation.target.join(", ")}
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
                  +₹{recommendation.estimated_savings_inr.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="h-8 w-px bg-[var(--color-border)]" />
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider block">
                  Spike Reduction
                </span>
                <span className="text-base font-extrabold text-[var(--color-primary)] font-mono">
                  -{recommendation.spike_risk_reduction_pct}%
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
                {recommendation.reasoning}
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
                  {recommendation.cited_rule}
                </div>
                <p className="text-[11px] text-[var(--color-text-muted)] leading-normal">
                  Fixed demand charges billed on maximum 15-min integrated demand. Clustered motor startup incurs penalties.
                </p>
                <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[var(--color-text-muted)]">Contract Limit:</span>
                  <span className="text-[var(--color-text-primary)] font-bold">500 kW</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stagger Actions Breakdown List */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-[var(--color-success)]" />
              Prescribed Action Sequence ({recommendation.actions.length} Steps)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {recommendation.actions.map((act, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--color-surface-3)] text-[var(--color-text-secondary)]">
                      STEP 0{idx + 1}
                    </span>
                    <span className="font-mono text-xs font-bold text-[var(--color-primary)]">
                      {act.action_type.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--color-text-primary)]">
                      {act.target_equipment || act.target_zone}
                    </h4>
                    <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                      {act.action_type === "pre_cool" && `Reduce setpoint ${act.temp_delta_celsius}°C (05:00-05:45 AM)`}
                      {act.action_type === "delay_start" && `Delay motor restart by +${act.delay_minutes} min (to 06:20 AM)`}
                      {act.action_type === "soft_ramp" && `Limit soft ramp rate to ${act.ramp_cap_pct}% cap during startup`}
                    </p>
                  </div>
                </div>
              ))}
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
