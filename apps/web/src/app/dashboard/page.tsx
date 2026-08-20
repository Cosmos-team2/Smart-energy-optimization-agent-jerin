"use client";

import { IndianRupee, AlertOctagon, TrendingUp, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { KPICard } from "@/components/KPICard";
import { DemandChart } from "@/components/DemandChart";
import { AlertsInbox } from "@/components/AlertsInbox";
import { WeatherContextCard } from "@/components/WeatherContextCard";
import { useTelemetryStream } from "@/hooks/useTelemetryStream";

export default function DashboardPage() {
  const telemetry = useTelemetryStream();

  // Format currency for India (e.g. ₹1,30,000)
  const formattedSavings = `₹${Number(telemetry.liveSavingsInr).toLocaleString("en-IN")}`;

  return (
    <div className="space-y-6">
      {/* Top Banner: Active Optimization Plan Alert */}
      <div className="relative overflow-hidden rounded-2xl glass-panel-glow p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex-shrink-0 animate-pulse">
            <AlertOctagon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-white">
                Critical Stagger Sequence Pending: rec_042
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Spike Imminent @ 06:00 AM
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Simultaneous restart of Chiller #2 and Compressor #1 creates a 777.71 kW demand spike exceeding the 500 kW contract limit.
            </p>
          </div>
        </div>

        <Link
          href="/approval"
          id="banner-approval-link"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500 transition-all flex-shrink-0 group"
        >
          <span>Open Approval Gate</span>
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* 3 Core KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* KPI 1: Savings this month (₹1,30,000) */}
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

        {/* KPI 2: Spike Risk (%) */}
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
          badgeType="cyan"
          icon={TrendingUp}
          trend={{
            value: "Zero Capex",
            isPositive: true,
            label: "no hardware retrofits required",
          }}
        />
      </div>

      {/* Main Content Grid: Demand Trend Chart (Recharts) & Alerts Inbox */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Demand Chart: 2/3 width */}
        <div className="lg:col-span-2">
          <DemandChart data={telemetry.trendData} activePeakKw={telemetry.currentPeakKw} />
        </div>

        {/* Alerts Inbox: 1/3 width */}
        <div className="lg:col-span-1">
          <AlertsInbox alerts={telemetry.alerts} isConnected={telemetry.isConnected} />
        </div>
      </div>

      {/* Bottom Section: MCP Context Envelope Data & Facility Summary */}
      <div className="grid grid-cols-1 gap-6">
        <WeatherContextCard />
      </div>
    </div>
  );
}
