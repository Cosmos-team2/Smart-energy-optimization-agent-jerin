"use client";

import {
  ResponsiveContainer, ComposedChart, Area, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from "recharts";
import { Zap, ShieldCheck, AlertTriangle } from "lucide-react";
import { SeedDataRecord } from "@/types/contracts";
import { SEED_DEMAND_CURVE } from "@/services/apiService";

interface DemandChartProps {
  data?: SeedDataRecord[];
  activePeakKw?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const baseline  = payload.find((p: any) => p.dataKey === "total_kw")?.value;
  const optimized = payload.find((p: any) => p.dataKey === "optimized_kw")?.value;
  return (
    <div
      className="rounded-xl p-3.5 shadow-2xl text-xs"
      style={{
        background: "rgba(16,16,26,0.98)",
        border: "1px solid rgba(139,92,246,0.25)",
        backdropFilter: "blur(12px)",
      }}
    >
      <p className="font-mono font-bold mb-2" style={{ color: "var(--color-text)" }}>
        {label} IST
        {baseline > 500 && <span className="ml-2 badge badge-rose">Spike</span>}
      </p>
      <div className="space-y-1.5 font-mono">
        {[
          { label: "Unmanaged", value: baseline,  color: "#F87171" },
          { label: "Optimized", value: optimized, color: "#34D399" },
          { label: "Contract",  value: "500.0 kW", color: "#A78BFA" },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5" style={{ color: row.color }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: row.color }} />
              {row.label}:
            </span>
            <span className="font-bold" style={{ color: row.color }}>
              {typeof row.value === "number" ? `${row.value} kW` : row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export function DemandChart({ data = SEED_DEMAND_CURVE, activePeakKw = 777.71 }: DemandChartProps) {
  const chartData = data && data.length > 0 ? data : SEED_DEMAND_CURVE;
  return (
    <div className="card p-5 sm:p-6 flex flex-col h-full relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
           style={{ background: "radial-gradient(circle at top right, rgba(139,92,246,0.06) 0%, transparent 65%)" }} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
        <div>
          <span className="section-tag mb-2 inline-flex">
            <Zap className="h-3 w-3" /> Live Feed
          </span>
          <h2 className="text-base sm:text-lg font-bold tracking-tight mt-1" style={{ color: "var(--color-text)" }}>
            15-Min Load Profile &amp;{" "}
            <span className="text-gradient">Peak Spike Analysis</span>
          </h2>
          <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
            HVAC Chiller + Air Compressor inrush vs Staggered Load Optimizer
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs flex-shrink-0">
          {[
            { dot: "#F87171", label: "Unmanaged (777 kW)" },
            { dot: "#34D399", label: "Optimized (420 kW)"  },
          ].map(r => (
            <div key={r.label} className="flex items-center gap-1.5" style={{ color: "var(--color-muted)" }}>
              <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: r.dot }} />
              {r.label}
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[300px] sm:h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="unmanagedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#F87171" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#F87171" stopOpacity={0.0}  />
              </linearGradient>
              <linearGradient id="optimizedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#34D399" stopOpacity={0.30} />
                <stop offset="95%" stopColor="#34D399" stopOpacity={0.0}  />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.08)" vertical={false} />
            <XAxis dataKey="Datetime" stroke="#6B6B8A" fontSize={11} tickLine={false}
                   axisLine={{ stroke: "rgba(139,92,246,0.12)" }} />
            <YAxis stroke="#6B6B8A" fontSize={11} tickLine={false}
                   axisLine={{ stroke: "rgba(139,92,246,0.12)" }} domain={[100, 850]}
                   tickFormatter={(v) => `${v}`} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={500} stroke="#A78BFA" strokeDasharray="5 4" strokeWidth={1.5}
              label={{ value: "500 kW limit", fill: "#A78BFA", fontSize: 10, position: "insideTopRight" }} />
            <Area   type="monotone" dataKey="total_kw"     stroke="#F87171" strokeWidth={2}   fill="url(#unmanagedGrad)" />
            <Line   type="monotone" dataKey="optimized_kw" stroke="#34D399" strokeWidth={2.5} dot={false}
                    activeDot={{ r: 5, fill: "#34D399", stroke: "#0A0A14", strokeWidth: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t flex flex-wrap items-center justify-between text-xs gap-2"
           style={{ borderColor: "var(--color-border)" }}>
        <div className="flex items-center gap-1.5" style={{ color: "var(--color-error)" }}>
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>Spike: <strong>06:00–06:15 AM</strong></span>
        </div>
        <div className="flex items-center gap-1.5" style={{ color: "var(--color-success)" }}>
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Peak shaved <strong>357 kW (46%)</strong></span>
        </div>
      </div>
    </div>
  );
}
