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

// Dynamically load Leaflet Map to avoid SSR window errors
const OSMLandingMap = dynamic(
  () => import("@/components/OSMLandingMap").then((mod) => mod.OSMLandingMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[88vh] rounded-3xl flex items-center justify-center font-mono text-sm" style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}>
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--color-primary)" }} />
          <span>Loading Interactive OpenStreetMap...</span>
        </div>
      </div>
    ),
  }
);

export default function SinglePageApp() {
  const [navVisible, setNavVisible] = useState(false);
  const telemetry = useTelemetryStream();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const approvalRef = useRef<HTMLDivElement>(null);

  // Effect to toggle NavBar visibility based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const threshold = window.innerHeight * 0.8; // show after scrolling past ~80% of viewport height
      setNavVisible(window.scrollY > threshold);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToDashboard = () => {
    dashboardRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToApproval = () => {
    approvalRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Approval Gate state
  const [recommendation, setRecommendation] = useState<RecommendationObject>(CANONICAL_REC_042);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [apiResponseMsg, setApiResponseMsg] = useState<string | null>(null);
  const [auditTimestamp, setAuditTimestamp] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const rec = await apiService.getRecommendation("rec_042");
        setRecommendation(rec);
      } catch {
        // Fallback to initial state
      }
    }
    loadData();
  }, []);

  /**
   * Handle Approve Action
   * Invokes POST /api/recommendations/:id/approve via apiService
   */
  const handleApprove = async () => {
    setIsActionLoading(true);
    setActionError(null);
    try {
      const res = await apiService.approveRecommendation(recommendation.id);
      if (res.success) {
        setRecommendation(res.recommendation);
        setApiResponseMsg(res.message);
        setAuditTimestamp(
          new Date().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }) + " IST"
        );
      }
    } catch (err: any) {
      setActionError(err?.message || "Failed to submit approval request");
    } finally {
      setIsActionLoading(false);
    }
  };

  /**
   * Handle Reject Action
   * Invokes POST /api/recommendations/:id/reject via apiService
   */
  const handleReject = async () => {
    setIsActionLoading(true);
    setActionError(null);
    try {
      const res = await apiService.rejectRecommendation(
        recommendation.id,
        "Operator manual override: chiller preventive maintenance scheduled"
      );
      if (res.success) {
        setRecommendation(res.recommendation);
        setApiResponseMsg(res.message);
        setAuditTimestamp(
          new Date().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }) + " IST"
        );
      }
    } catch (err: any) {
      setActionError(err?.message || "Failed to submit rejection request");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReset = () => {
    setRecommendation({
      ...CANONICAL_REC_042,
      status: "proposed",
    });
    setApiResponseMsg(null);
    setAuditTimestamp(null);
    setActionError(null);
  };

  const isApproved = recommendation.status === "approved";
  const isRejected = recommendation.status === "rejected";
  const isProposed = recommendation.status === "proposed";

  const getStatusBadge = () => {
    if (isApproved) {
      return (
        <span
          id="status-badge"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[var(--color-success)]/20 text-[var(--color-success)] border border-[var(--color-success)]/40 shadow-sm shadow-[var(--color-success)]/20"
        >
          <CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" />
          APPROVED & DEPLOYED
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
      {/* Sliding NavBar */}
      <NavBar
        visible={navVisible}
        onMap={scrollToTop}
        onDashboard={scrollToDashboard}
        onApproval={scrollToApproval}
      />

      {/* SECTION 1: OSM LANDING MAP WITH TRANSLUCENT CURVED SIDEBAR */}
      <section className="px-3 sm:px-6 pt-3 sm:pt-4 max-w-[1600px] mx-auto">
        <OSMLandingMap onScrollToDashboard={scrollToDashboard} />
      </section>

      {/* FLOATING QUICK SECTION NAVIGATION PILL */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
        <button
          onClick={scrollToTop}
          title="Back to Map"
          className="p-3 rounded-full glass-panel hover:scale-105 transition-all shadow-xl"
          style={{ border: "1px solid rgba(139,92,246,0.20)", color: "#A0A0B8" }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#A78BFA"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(139,92,246,0.50)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#A0A0B8"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(139,92,246,0.20)"; }}
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>

      {/* SECTION 2: LIVE TELEMETRY & SPIKE ANALYTICS DASHBOARD */}
      <section
        ref={dashboardRef}
        id="dashboard"
        className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-10 pb-14 space-y-6"
      >
        {/* Section Title & Live Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b" style={{ borderColor: "rgba(139,92,246,0.15)" }}>
          <div>
            <span className="section-tag mb-2 inline-flex">Module 02 · Telemetry</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
              Facility{" "}<span className="text-gradient">Live Dashboard</span>
            </h2>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono"
               style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.20)", color: "#A78BFA" }}>
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            <span>LIVE TELEMETRY</span>
          </div>
        </div>

        {/* Top Banner: Spike Warning & Quick Jump to Approval */}
        <div className="relative overflow-hidden rounded-2xl glass-panel-glow p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[var(--color-border)] bg-[var(--color-card)]/90">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-[var(--color-warning)]/15 border border-[var(--color-warning)]/30 text-[var(--color-warning)] flex-shrink-0 animate-pulse">
              <AlertOctagon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] font-heading">
                  Simultaneous Startup Spike Forecast: rec_042
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-error)]/20 text-[var(--color-error)] border border-[var(--color-error)]/30">
                  Spike @ 06:00 AM (777.71 kW)
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Chiller #2 and Compressor #1 restart exceeds 500 kW contract limit. Stagger plan reduces peak to 420.0 kW.
              </p>
            </div>
          </div>

          <button
            onClick={scrollToApproval}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-semibold shadow-lg shadow-[var(--color-primary)]/25 transition-all flex-shrink-0"
          >
            <span>Jump to Approval Gate ↓</span>
          </button>
        </div>

        {/* 3 Core KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* KPI 1: Savings this month */}
          <KPICard
            title="Savings This Month"
            value={formattedSavings}
            subValue="Avoided DISCOM 15-min demand charge penalty"
            badgeText="Verified Tariff"
            badgeType="emerald"
            icon={IndianRupee}
            glow={true}
            trend={{
              value: "+18.4%",
              isPositive: true,
              label: "vs previous billing cycle",
            }}
          />

          {/* KPI 2: Spike Risk */}
          <KPICard
            title="Spike Risk"
            value={`${telemetry.spikeRiskPct}%`}
            subValue="Unmanaged: 777.71 kW (exceeds 500 kW limit)"
            badgeText="Critical Window"
            badgeType="rose"
            icon={AlertOctagon}
            trend={{
              value: "-62.5%",
              isPositive: true,
              label: "risk reduction with stagger plan",
            }}
          />

          {/* KPI 3: ROI */}
          <KPICard
            title="Projected ROI"
            value="4.8x"
            subValue="₹15.6L annualized demand charge savings"
            badgeText="1.8 Mo Payback"
            badgeType="blue"
            icon={TrendingUp}
            trend={{
              value: "Zero Capex",
              isPositive: true,
              label: "no hardware retrofits required",
            }}
          />
        </div>

        {/* Recharts Demand Chart & Alerts Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DemandChart data={telemetry.trendData} activePeakKw={telemetry.currentPeakKw} />
          </div>

          <div className="lg:col-span-1">
            <AlertsInbox alerts={telemetry.alerts} />
          </div>
        </div>

        {/* MCP Weather & Solar Context Envelope */}
        <div>
          <WeatherContextCard />
        </div>
      </section>

      {/* SECTION 3: CENTERPIECE APPROVAL GATE SCREEN */}
      <section
        ref={approvalRef}
        id="approval"
        className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-6 pb-20 space-y-6"
      >
        {/* Section Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b" style={{ borderColor: "rgba(139,92,246,0.20)" }}>
          <div>
            <span className="section-tag mb-2 inline-flex">Module 03 · Decision Gate</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
              Human-in-the-Loop{" "}<span className="text-gradient">Approval Gate</span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {getStatusBadge()}
            {!isProposed && (
              <button
                onClick={handleReset}
                id="reset-demo-btn"
                title="Reset to Pending for demo testing"
                className="p-2 rounded-lg bg-[var(--color-bg-secondary)] hover:bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xs flex items-center gap-1 border border-[var(--color-border)] transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Recommendation Card */}
        <div
          className={`glass-panel rounded-3xl p-6 sm:p-8 transition-all duration-300 border bg-[var(--color-card)]/90 ${
            isApproved
              ? "border-[var(--color-success)]/50 bg-[var(--color-success)]/5 shadow-[var(--color-success)]/10 shadow-2xl"
              : isRejected
              ? "border-[var(--color-error)]/50 bg-[var(--color-error)]/5"
              : "border-[var(--color-border)]"
          }`}
        >
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--color-border)]">
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <span className="text-xs font-mono font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Recommendation ID: {recommendation.id}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border)] uppercase">
                  {recommendation.type} optimization
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[var(--color-text-primary)] tracking-tight font-heading">
                15-Min Demand Spike Stagger Schedule
              </h3>
            </div>
            <div>{getStatusBadge()}</div>
          </div>

          {/* 4 Decision Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {/* Savings – green */}
            <div className="p-4 rounded-2xl relative overflow-hidden" style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.25)" }}>
              <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full" style={{ background: "radial-gradient(circle, rgba(52,211,153,0.15) 0%, transparent 70%)" }} />
              <div className="text-xs font-semibold mb-1 flex items-center gap-1" style={{ color: "#34D399" }}>
                <IndianRupee className="h-3.5 w-3.5" /> Savings
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono" style={{ color: "#34D399" }}>
                ₹{Number(recommendation.estimated_savings_inr).toLocaleString("en-IN")}
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: "#A0A0B8" }}>Avoided demand charge</div>
            </div>

            {/* Risk – amber */}
            <div className="p-4 rounded-2xl relative overflow-hidden" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)" }}>
              <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full" style={{ background: "radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%)" }} />
              <div className="text-xs font-semibold mb-1 flex items-center gap-1" style={{ color: "#FBBF24" }}>
                <AlertOctagon className="h-3.5 w-3.5" /> Risk Cut
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono" style={{ color: "#FBBF24" }}>
                {recommendation.spike_risk_reduction_pct}%
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: "#A0A0B8" }}>Spike breach probability</div>
            </div>

            {/* Peak – purple */}
            <div className="p-4 rounded-2xl relative overflow-hidden" style={{ background: "rgba(139,92,246,0.10)", border: "1px solid rgba(139,92,246,0.30)" }}>
              <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)" }} />
              <div className="text-xs font-semibold mb-1 flex items-center gap-1" style={{ color: "#A78BFA" }}>
                <Zap className="h-3.5 w-3.5" /> Peak Capped
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono" style={{ color: "#A78BFA" }}>
                {recommendation.optimized_peak_kw} <span className="text-xs font-normal" style={{ color: "#6B6B8A" }}>kW</span>
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: "#F87171" }}>Baseline: {recommendation.baseline_peak_kw} kW</div>
            </div>

            {/* Confidence – pink */}
            <div className="p-4 rounded-2xl relative overflow-hidden" style={{ background: "rgba(192,132,252,0.08)", border: "1px solid rgba(192,132,252,0.25)" }}>
              <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full" style={{ background: "radial-gradient(circle, rgba(192,132,252,0.15) 0%, transparent 70%)" }} />
              <div className="text-xs font-semibold mb-1 flex items-center gap-1" style={{ color: "#C084FC" }}>
                <Sparkles className="h-3.5 w-3.5" /> AI Confidence
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono" style={{ color: "#C084FC" }}>
                {Math.round(recommendation.confidence * 100)}%
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: "#34D399" }}>Solver validated ✓</div>
            </div>
          </div>
        </div>

        {/* Reasoning & Rule Citation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 glass-panel rounded-3xl p-6 sm:p-7 border border-[var(--color-border)] bg-[var(--color-card)]/90">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/25 text-[var(--color-primary)]">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)] tracking-tight font-heading">
                  Agent Reasoning & Root Cause Analysis
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)]">MILP optimization & simultaneous load inrush</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--color-bg-secondary)]/90 border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm leading-relaxed mb-4">
              <p>{recommendation.reasoning}</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-[var(--color-text-secondary)] font-semibold flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" /> Target Assets:
              </span>
              {recommendation.target?.map((tgt) => (
                <span
                  key={tgt}
                  className="px-2.5 py-1 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-mono"
                >
                  {tgt}
                </span>
              ))}
            </div>
          </div>

          <div className="md:col-span-1 glass-panel rounded-3xl p-6 sm:p-7 flex flex-col justify-between border border-[var(--color-border)] bg-[var(--color-card)]/90">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-xl bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/25 text-[var(--color-warning)]">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--color-text-primary)] tracking-tight font-heading">Cited DISCOM Rule</h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">Regulatory tariff constraint</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 text-[var(--color-warning)] font-mono text-xs font-bold mb-3">
                § {recommendation.cited_rule}
              </div>

              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                DISCOM demand charges are computed strictly on the highest 15-minute kW average recorded throughout the billing month. Exceeding 500 kW incurs permanent capacity penalties.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--color-border)] text-[11px] font-mono text-[var(--color-success)] flex items-center gap-1">
              <Check className="h-3.5 w-3.5" /> Enforced by Optimizer MILP Core
            </div>
          </div>
        </div>

        {/* 3-Stage Stagger Action Plan */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-[var(--color-border)] bg-[var(--color-card)]/90">
          <div className="flex items-center justify-between gap-2 mb-5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/25 text-[var(--color-primary)]">
                <Sliders className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)] tracking-tight font-heading">
                  Recommended 3-Stage Stagger Action Plan
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)]">Deterministic equipment dispatch timeline</p>
              </div>
            </div>
            <span className="text-xs font-mono text-[var(--color-primary-hover)] bg-[var(--color-primary)]/10 px-3 py-1 rounded-lg border border-[var(--color-primary)]/30">
              Sequence: 05:00 - 06:20 AM
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendation.actions?.map((act, index) => {
              const isPrecool = act.action_type === "pre_cool";
              const isDelay = act.action_type === "delay_start";
              const isSoftRamp = act.action_type === "soft_ramp";
              // Per-stage color theme
              const stageTheme = isPrecool
                ? { accent: "#22D3EE", bg: "rgba(34,211,238,0.07)",  border: "rgba(34,211,238,0.22)",  glow: "rgba(34,211,238,0.12)",  label: "badge-cyan" }
                : isDelay
                ? { accent: "#FBBF24", bg: "rgba(251,191,36,0.07)",  border: "rgba(251,191,36,0.22)",  glow: "rgba(251,191,36,0.12)",  label: "badge-amber" }
                : { accent: "#A78BFA", bg: "rgba(139,92,246,0.09)",  border: "rgba(139,92,246,0.25)",  glow: "rgba(139,92,246,0.12)",  label: "badge-purple" };

              return (
                <div key={index} className="p-4 rounded-2xl flex flex-col justify-between relative overflow-hidden transition-all"
                     style={{ background: stageTheme.bg, border: `1px solid ${stageTheme.border}` }}>
                  {/* Corner glow */}
                  <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full pointer-events-none"
                       style={{ background: `radial-gradient(circle, ${stageTheme.glow} 0%, transparent 70%)` }} />
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={`badge ${stageTheme.label}`}>ACTION #{index + 1}: {act.action_type.toUpperCase()}</span>
                      <span className="text-xs font-mono font-bold" style={{ color: stageTheme.accent }}>{act.time_window}</span>
                    </div>

                    <h4 className="text-sm font-bold mb-1.5" style={{ color: stageTheme.accent }}>
                      {isPrecool && "Thermal Pre-Cooling"}
                      {isDelay && "Stagger Compressor Startup"}
                      {isSoftRamp && "Soft-Ramp Chiller Load"}
                    </h4>

                    <p className="text-xs leading-relaxed mb-3" style={{ color: "#A0A0B8" }}>
                      {act.description ||
                        (isPrecool
                          ? `Drop zone setpoint by ${act.temp_delta_celsius}°C to build thermal inertia.`
                          : isDelay
                          ? `Delay compressor startup by ${act.delay_minutes} minutes.`
                          : `Cap chiller ramp rate to ${act.ramp_cap_pct}% during peak window.`)}
                    </p>
                  </div>

                  <div className="pt-3 border-t text-[11px] font-mono flex items-center justify-between"
                       style={{ borderColor: stageTheme.border }}>
                    <span style={{ color: "#6B6B8A" }}>Target:</span>
                    <span className="font-bold" style={{ color: stageTheme.accent }}>{act.target_equipment || act.target_zone}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Confirmation Audit Banner */}
        {apiResponseMsg && (
          <div
            className={`p-4 rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 border ${
              isApproved
                ? "bg-[var(--color-success)]/15 border-[var(--color-success)]/40 text-[var(--color-success)]"
                : "bg-[var(--color-error)]/15 border-[var(--color-error)]/40 text-[var(--color-error)]"
            }`}
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
        <div className="rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5 relative overflow-hidden"
             style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(99,102,241,0.08) 50%, rgba(192,132,252,0.10) 100%)", border: "1px solid rgba(139,92,246,0.25)" }}>
          {/* Background glow blobs */}
          <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full pointer-events-none"
               style={{ background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 65%)" }} />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
               style={{ background: "radial-gradient(circle, rgba(192,132,252,0.12) 0%, transparent 65%)" }} />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: "#A78BFA" }} />
              <h3 className="text-sm font-bold" style={{ color: "#F0F0FF" }}>Facility Manager Action Required</h3>
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
              style={isRejected ? { opacity: 0.5, cursor: "not-allowed", borderColor: "rgba(248,113,113,0.40)", color: "#F87171" } : {}}
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
              style={isApproved ? { background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.35)", color: "#34D399", cursor: "not-allowed", boxShadow: "none" } : {}}
            >
              {isActionLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /><span>Deploying...</span></>
              ) : isApproved ? (
                <><CheckCircle2 className="h-4 w-4" /><span>Schedule Active</span></>
              ) : (
                <><CheckCircle2 className="h-4 w-4" /><span>Approve &amp; Deploy Stagger Schedule</span></>
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
