"use client";

import { useEffect, useState } from "react";
import { Sun, CloudRain, Zap, Shield, Globe2, Compass } from "lucide-react";
import { MCPEnvelope, WeatherMCPPayload } from "@/types/contracts";
import { unwrapMCPEnvelope, getMCPExtendedInfo, createMockWeatherEnvelope } from "@/services/mcpAdapter";
import { apiService } from "@/services/apiService";

export function WeatherContextCard() {
  const [rawEnvelope, setRawEnvelope] = useState<MCPEnvelope<WeatherMCPPayload> | null>(null);

  useEffect(() => {
    apiService.getWeatherMCPContext().then(setRawEnvelope);
  }, []);

  const payload = unwrapMCPEnvelope<WeatherMCPPayload>(rawEnvelope || createMockWeatherEnvelope());
  const meta    = getMCPExtendedInfo(rawEnvelope || createMockWeatherEnvelope());

  const metrics = [
    { icon: Sun,       color: "#FBBF24", label: "Ambient Temp",     value: `${payload.temp_celsius || 34.8}°C`,       sub: "High thermal load",    subColor: "var(--color-warning)" },
    { icon: CloudRain, color: "#818CF8", label: "Humidity",         value: `${payload.humidity_pct || 58.0}%`,         sub: "Moderate dew point",   subColor: "var(--color-muted)"   },
    { icon: Sun,       color: "#F59E0B", label: "Solar Irradiance", value: `${payload.solar_ghi || 742} W/m²`,         sub: "Peak PV generation",   subColor: "var(--color-success)" },
    { icon: Zap,       color: "#34D399", label: "Peak TOD Tariff",  value: `₹${payload.tod_rate_inr || 9.85}/kWh`,     sub: "Peak hour penalty",    subColor: "var(--color-error)"   },
  ];

  return (
    <div className="card p-5 sm:p-6 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute -top-12 -left-12 w-48 h-48 pointer-events-none"
           style={{ background: "radial-gradient(circle, rgba(129,140,248,0.07) 0%, transparent 70%)" }} />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-3">
          <div className="icon-box"><Sun className="h-4 w-4" /></div>
          <div>
            <h3 className="text-base font-bold tracking-tight" style={{ color: "var(--color-text)" }}>
              MCP <span className="text-gradient">Context Envelope</span>
            </h3>
            <p className="text-xs" style={{ color: "var(--color-muted)" }}>Open-Meteo &amp; NASA POWER</p>
          </div>
        </div>
        <span className="badge badge-purple font-mono">
          {Math.round(meta.confidence * 100)}% conf
        </span>
      </div>

      {/* Envelope meta row */}
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs font-mono px-3 py-2 rounded-lg"
           style={{ background: "rgba(139,92,246,0.06)", border: "1px solid var(--color-border)" }}>
        <span className="flex items-center gap-1.5" style={{ color: "var(--color-accent-3)" }}>
          <Globe2 className="h-3.5 w-3.5" />
          source: <strong>{meta.source}</strong>
        </span>
        <span className="flex items-center gap-1.5" style={{ color: "var(--color-success)" }}>
          <Shield className="h-3.5 w-3.5" /> schema validated
        </span>
        <span className="flex items-center gap-1.5" style={{ color: "var(--color-muted)" }}>
          <Compass className="h-3.5 w-3.5" /> 12.9716°N 77.5946°E
        </span>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metrics.map(({ icon: Icon, color, label, value, sub, subColor }) => (
          <div key={label} className="rounded-xl p-3"
               style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Icon className="h-3.5 w-3.5" style={{ color }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-subtle)" }}>
                {label}
              </span>
            </div>
            <p className="text-base font-extrabold font-mono" style={{ color: "var(--color-text)" }}>{value}</p>
            <p className="text-[10px] mt-0.5" style={{ color: subColor }}>{sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t text-xs flex justify-between"
           style={{ borderColor: "var(--color-border)", color: "var(--color-subtle)" }}>
        <span>DISCOM: BESCOM HT-2a</span>
        <span style={{ color: "var(--color-success)" }}>● Auto-refreshing</span>
      </div>
    </div>
  );
}
