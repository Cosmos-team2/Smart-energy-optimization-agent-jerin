"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Sparkles,
  Zap,
  IndianRupee,
  Layers,
  ArrowRight,
  Loader2,
  RotateCcw,
  BookOpen,
  Sliders,
  Check,
  AlertTriangle,
} from "lucide-react";
import { RecommendationObject, RecommendationStatus } from "@/types/contracts";
import { apiService, CANONICAL_REC_042 } from "@/services/apiService";

export default function ApprovalPage() {
  const [recommendation, setRecommendation] = useState<RecommendationObject>(CANONICAL_REC_042);
  const [isLoading, setIsLoading] = useState(false);
  const [apiResponseMsg, setApiResponseMsg] = useState<string | null>(null);
  const [auditTimestamp, setAuditTimestamp] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch recommendation from API service (Contract 3)
    async function loadData() {
      try {
        const rec = await apiService.getRecommendation("rec_042");
        setRecommendation(rec);
      } catch {
        // Default to canonical
      }
    }
    loadData();
  }, []);

  /**
   * Handle Approve Action
   * Invokes POST /api/recommendations/:id/approve via apiService
   */
  const handleApprove = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const res = await apiService.approveRecommendation(recommendation.id);
      if (res.success) {
        setRecommendation(res.recommendation);
        setApiResponseMsg(res.message);
        setAuditTimestamp(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " IST");
      }
    } catch (err: any) {
      setActionError(err?.message || "Failed to submit approval request");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle Reject Action
   * Invokes POST /api/recommendations/:id/reject via apiService
   */
  const handleReject = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const res = await apiService.rejectRecommendation(
        recommendation.id,
        "Operator manual override: chiller preventive maintenance scheduled"
      );
      if (res.success) {
        setRecommendation(res.recommendation);
        setApiResponseMsg(res.message);
        setAuditTimestamp(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " IST");
      }
    } catch (err: any) {
      setActionError(err?.message || "Failed to submit rejection request");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Reset helper for testing demo states
   */
  const handleReset = () => {
    setRecommendation({
      ...CANONICAL_REC_042,
      status: "proposed",
    });
    setApiResponseMsg(null);
    setAuditTimestamp(null);
    setActionError(null);
  };

  // Status-dependent visual configurations
  const isApproved = recommendation.status === "approved";
  const isRejected = recommendation.status === "rejected";
  const isProposed = recommendation.status === "proposed";

  const getStatusBadge = () => {
    if (isApproved) {
      return (
        <span
          id="status-badge"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          APPROVED & DEPLOYED
        </span>
      );
    }
    if (isRejected) {
      return (
        <span
          id="status-badge"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm"
        >
          <XCircle className="h-4 w-4 text-rose-400" />
          REJECTED / OVERRIDDEN
        </span>
      );
    }
    return (
      <span
        id="status-badge"
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse shadow-sm"
      >
        <Clock className="h-4 w-4 text-amber-400" />
        PENDING HUMAN APPROVAL
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner: Status & Overview */}
      <div
        className={`glass-panel rounded-2xl p-6 sm:p-8 transition-all duration-300 ${
          isApproved
            ? "border-emerald-500/40 bg-emerald-950/10 shadow-emerald-500/10 shadow-2xl"
            : isRejected
            ? "border-rose-500/40 bg-rose-950/10"
            : "border-white/10"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Recommendation ID: {recommendation.id}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                {recommendation.type} optimization
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              15-Min Demand Spike Stagger Gate
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {getStatusBadge()}
            {!isProposed && (
              <button
                onClick={handleReset}
                id="reset-demo-btn"
                title="Reset to Pending for demo testing"
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 border border-slate-700 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Core Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          {/* Metric 1: Estimated Savings */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
              <IndianRupee className="h-3.5 w-3.5 text-emerald-400" />
              Estimated Savings
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              ₹{Number(recommendation.estimated_savings_inr).toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Avoided demand charge</div>
          </div>

          {/* Metric 2: Spike Risk Reduction */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
              Risk Reduction
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono">
              {recommendation.spike_risk_reduction_pct}%
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Peak breach probability</div>
          </div>

          {/* Metric 3: Peak Load Shaving */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-cyan-400" />
              Peak Load Capping
            </div>
            <div className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">
              {recommendation.optimized_peak_kw} <span className="text-xs font-normal text-slate-400">kW</span>
            </div>
            <div className="text-[11px] text-rose-400 mt-0.5">Baseline: {recommendation.baseline_peak_kw} kW</div>
          </div>

          {/* Metric 4: Confidence */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              AI Confidence
            </div>
            <div className="text-xl sm:text-2xl font-black text-purple-300 font-mono">
              {Math.round(recommendation.confidence * 100)}%
            </div>
            <div className="text-[11px] text-emerald-400 mt-0.5">Solver validated</div>
          </div>
        </div>
      </div>

      {/* Centerpiece Reasoning & Cited Rule Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Reasoning Explanation */}
        <div className="md:col-span-2 glass-panel rounded-2xl p-6 sm:p-7">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Agent Reasoning & Root Cause</h2>
              <p className="text-xs text-slate-400">MILP optimization & simultaneous load analysis</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 text-sm leading-relaxed mb-4">
            <p className="font-normal">{recommendation.reasoning}</p>
          </div>

          {/* Target Zones & Equipments Tags */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-slate-500" /> Target Assets:
            </span>
            {recommendation.target?.map((tgt) => (
              <span
                key={tgt}
                className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-200 font-mono"
              >
                {tgt}
              </span>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Cited Rule Badge & Explanation */}
        <div className="md:col-span-1 glass-panel rounded-2xl p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Cited DISCOM Rule</h2>
                <p className="text-xs text-slate-400">Regulatory tariff constraint</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold mb-3">
              § {recommendation.cited_rule}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              DISCOM demand charges are computed strictly on the highest 15-minute kW average recorded throughout the billing month. Exceeding 500 kW incurs permanent capacity penalties.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-emerald-400 flex items-center gap-1">
            <Check className="h-3.5 w-3.5" /> Enforced by Optimizer MILP Core
          </div>
        </div>
      </div>

      {/* 3-Action Stagger Execution Sequence */}
      <div className="glass-panel rounded-2xl p-6 sm:p-7">
        <div className="flex items-center justify-between gap-2 mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Recommended 3-Stage Stagger Action Plan
              </h2>
              <p className="text-xs text-slate-400">Deterministic equipment dispatch timeline</p>
            </div>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded-md border border-cyan-500/30">
            Sequence: 05:00 - 06:20 AM
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendation.actions?.map((act, index) => {
            const isPrecool = act.action_type === "pre_cool";
            const isDelay = act.action_type === "delay_start";
            const isSoftRamp = act.action_type === "soft_ramp";

            return (
              <div
                key={index}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                      Action #{index + 1}: {act.action_type}
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {act.time_window}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-1.5">
                    {isPrecool && "Thermal Pre-Cooling"}
                    {isDelay && "Stagger Compressor Startup"}
                    {isSoftRamp && "Soft-Ramp Chiller Load"}
                  </h4>

                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    {act.description ||
                      (isPrecool
                        ? `Drop zone setpoint by ${act.temp_delta_celsius}°C to build thermal inertia.`
                        : isDelay
                        ? `Delay compressor startup by ${act.delay_minutes} minutes.`
                        : `Cap chiller ramp rate to ${act.ramp_cap_pct}% during peak window.`)}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-300 flex items-center justify-between">
                  <span>Target:</span>
                  <span className="text-cyan-300 font-semibold">{act.target_equipment || act.target_zone}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error or Feedback Alert */}
      {actionError && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Confirmation Audit Banner */}
      {apiResponseMsg && (
        <div
          className={`p-4 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 border ${
            isApproved
              ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
              : "bg-rose-950/30 border-rose-500/40 text-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {isApproved ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
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
      <div className="glass-panel rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white">Facility Manager Action Required</h3>
          <p className="text-xs text-slate-400">
            Approving triggers automated dispatch to Zone 3 & Compressor 1 controllers.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Reject Button */}
          <button
            type="button"
            id="reject-recommendation-btn"
            onClick={handleReject}
            disabled={isLoading || isRejected}
            className={`flex-1 sm:flex-initial px-5 py-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
              isRejected
                ? "bg-rose-950/40 border-rose-500/50 text-rose-300 opacity-60 cursor-not-allowed"
                : "bg-slate-900 hover:bg-rose-950/30 border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-300"
            }`}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            <span>Reject Plan</span>
          </button>

          {/* Approve Button */}
          <button
            type="button"
            id="approve-recommendation-btn"
            onClick={handleApprove}
            disabled={isLoading || isApproved}
            className={`flex-1 sm:flex-initial px-7 py-3 rounded-xl text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
              isApproved
                ? "bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 cursor-not-allowed shadow-none"
                : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 shadow-emerald-500/25 hover:shadow-emerald-500/40 group"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                <span>Contacting Controller Spine...</span>
              </>
            ) : isApproved ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Schedule Active</span>
              </>
            ) : (
              <>
                <span>Approve & Deploy Stagger Schedule</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
