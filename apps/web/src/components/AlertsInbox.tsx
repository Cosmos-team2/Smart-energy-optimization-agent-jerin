"use client";

import { AlertCircle, AlertTriangle, Info, ArrowRight, Bell, CheckCircle } from "lucide-react";
import { TelemetryAlert } from "@/types/contracts";

interface AlertsInboxProps {
  alerts?: TelemetryAlert[];
  onSelectRecommendation?: () => void;
  isConnected?: boolean;
}

export function AlertsInbox({ alerts = [], onSelectRecommendation, isConnected = true }: AlertsInboxProps) {
  const cfg = (s: TelemetryAlert["severity"]) =>
    ({
      critical: {
        Icon: AlertCircle,
        badge: "badge-rose",
        border: "rgba(248,113,113,0.18)",
        bg: "rgba(248,113,113,0.05)",
        label: "CRITICAL",
      },
      warning: {
        Icon: AlertTriangle,
        badge: "badge-amber",
        border: "rgba(251,191,36,0.18)",
        bg: "rgba(251,191,36,0.04)",
        label: "WARNING",
      },
      info: {
        Icon: Info,
        badge: "badge-blue",
        border: "var(--color-border)",
        bg: "transparent",
        label: "INFO",
      },
    }[s] ?? {
      Icon: Info,
      badge: "badge-blue",
      border: "var(--color-border)",
      bg: "transparent",
      label: "INFO",
    });

  return (
    <div className="card p-5 sm:p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-5">
        <div className="flex items-center gap-3">
          <div className="icon-box">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight" style={{ color: "var(--color-text)" }}>
              Facility <span className="text-gradient">Alerts</span>
            </h3>
            <p className="text-xs" style={{ color: "var(--color-muted)" }}>
              Real-time anomaly &amp; tariff events
            </p>
          </div>
        </div>
        <span className="badge badge-purple">{alerts.length} Active</span>
      </div>

      {/* List */}
      <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[380px] pr-0.5">
        {alerts.map((alert) => {
          const { Icon, badge, border, bg, label } = cfg(alert.severity);
          return (
            <div
              key={alert.id}
              className="rounded-xl p-3.5 transition-all border"
              style={{ background: bg, borderColor: border }}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`badge ${badge}`}>{label}</span>
                  <span className="text-xs font-semibold" style={{ color: "var(--color-text)" }}>
                    {alert.title}
                  </span>
                </div>
                <span
                  className="text-[11px] font-mono flex-shrink-0"
                  style={{ color: "var(--color-subtle)" }}
                >
                  {alert.timestamp}
                </span>
              </div>
              <p
                className="text-xs leading-relaxed mb-2"
                style={{ color: "var(--color-muted)" }}
              >
                {alert.message}
              </p>
              {alert.recommendation_id && (
                <div
                  className="pt-2 border-t flex items-center justify-between"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <span
                    className="text-[11px] flex items-center gap-1"
                    style={{ color: "var(--color-success)" }}
                  >
                    <CheckCircle className="h-3 w-3" /> rec_042 · +₹1.30L
                  </span>
                  <button
                    type="button"
                    onClick={onSelectRecommendation}
                    className="inline-flex items-center gap-1 text-xs font-semibold group cursor-pointer hover:underline"
                    style={{ color: "var(--color-accent-1)" }}
                  >
                    Review Plan
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        className="mt-4 pt-3 border-t flex items-center justify-between text-xs"
        style={{ borderColor: "var(--color-border)", color: "var(--color-subtle)" }}
      >
        <span className="font-mono">ws://127.0.0.1:8000/ws/telemetry</span>
        <span
          className="font-semibold"
          style={{ color: isConnected ? "var(--color-success)" : "var(--color-error)" }}
        >
          ● {isConnected ? "Live" : "Offline"}
        </span>
      </div>
    </div>
  );
}
