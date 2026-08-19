"use client";

import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  subValue?: string;
  badgeText?: string;
  badgeType?: "emerald" | "amber" | "rose" | "blue" | "cyan" | "purple";
  icon: LucideIcon;
  trend?: { value: string; isPositive: boolean; label: string };
  glow?: boolean;
}

export function KPICard({
  title,
  value,
  subValue,
  badgeText,
  badgeType = "purple",
  icon: Icon,
  trend,
  glow = false,
}: KPICardProps) {
  const badgeClass = `badge badge-${badgeType}`;

  return (
    <div
      className={`card glass-card-interactive p-5 sm:p-6 flex flex-col gap-3 relative overflow-hidden ${glow ? "glass-panel-glow" : ""}`}
    >
      {/* Subtle inner glow blob */}
      <div
        className="absolute -top-8 -right-8 w-28 h-28 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)" }}
      />

      {/* Top row: icon + badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="icon-box flex-shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        {badgeText && <span className={badgeClass}>{badgeText}</span>}
      </div>

      {/* Label */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-subtle)" }}>
          {title}
        </p>
        {/* Value */}
        <p className="text-2xl sm:text-3xl font-extrabold mt-1 tracking-tight" style={{ color: "var(--color-text)" }}>
          {value}
        </p>
        {subValue && (
          <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--color-muted)" }}>{subValue}</p>
        )}
      </div>

      {/* Trend */}
      {trend && (
        <div
          className="flex items-center gap-1.5 text-xs pt-3 border-t"
          style={{ borderColor: "var(--color-border)" }}
        >
          {trend.isPositive
            ? <TrendingUp  className="h-3.5 w-3.5" style={{ color: "var(--color-success)" }} />
            : <TrendingDown className="h-3.5 w-3.5" style={{ color: "var(--color-error)" }} />
          }
          <span className="font-semibold" style={{ color: trend.isPositive ? "var(--color-success)" : "var(--color-error)" }}>
            {trend.value}
          </span>
          <span style={{ color: "var(--color-subtle)" }}>{trend.label}</span>
        </div>
      )}
    </div>
  );
}
