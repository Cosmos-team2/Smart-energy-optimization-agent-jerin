"use client";

import { useEffect, useState } from "react";
import { WebSocketEvent, SeedDataRecord, TelemetryAlert } from "@/types/contracts";
import { telemetryWS } from "@/services/mockWebSocket";
import { SEED_DEMAND_CURVE } from "@/services/apiService";

export interface TelemetryState {
  isConnected: boolean;
  latestReading: SeedDataRecord;
  trendData: SeedDataRecord[];
  alerts: TelemetryAlert[];
  currentPeakKw: number;
  spikeRiskPct: number;
  liveSavingsInr: number;
}

const INITIAL_ALERTS: TelemetryAlert[] = [
  {
    id: "alt_001",
    title: "Simultaneous Startup Spike Imminent",
    message: "Chiller #2 + Compressor #1 restart will peak at 777.71 kW (15-min window: 06:00-06:15 AM)",
    timestamp: "05:52 AM",
    severity: "critical",
    zone_id: "z_hvac_3",
    equipment_id: "eq_comp_1",
    recommendation_id: "rec_042",
    peak_kw: 777.71,
    limit_kw: 500.0,
  },
  {
    id: "alt_002",
    title: "Pre-Cooling Opportunity Detected",
    message: "Ambient temperature rising to 34.8°C. Pre-cooling Zone 3 will reduce peak load by 45 kW.",
    timestamp: "05:30 AM",
    severity: "warning",
    zone_id: "z_hvac_3",
  },
  {
    id: "alt_003",
    title: "Solar GHI Generation Forecast",
    message: "NASA POWER model estimates 742 W/m² irradiance at 11:00 AM. Aligned with chiller soft ramp.",
    timestamp: "05:00 AM",
    severity: "info",
  },
];

export function useTelemetryStream() {
  const [telemetry, setTelemetry] = useState<TelemetryState>({
    isConnected: true,
    latestReading: SEED_DEMAND_CURVE[7], // 06:00 AM spike
    trendData: SEED_DEMAND_CURVE,
    alerts: INITIAL_ALERTS,
    currentPeakKw: 777.71,
    spikeRiskPct: 62.5,
    liveSavingsInr: 130000,
  });

  useEffect(() => {
    telemetryWS.connect();

    const unsubscribe = telemetryWS.subscribe((event: WebSocketEvent) => {
      if (event.event === "reading") {
        const reading = event.payload as SeedDataRecord;
        setTelemetry((prev) => {
          // Update the current reading and shift trend slightly for animation
          const updatedTrend = prev.trendData.map((item) =>
            item.Datetime === reading.Datetime ? { ...item, total_kw: reading.total_kw, optimized_kw: reading.optimized_kw } : item
          );

          return {
            ...prev,
            latestReading: reading,
            trendData: updatedTrend,
            currentPeakKw: Math.max(prev.currentPeakKw, reading.total_kw),
          };
        });
      } else if (event.event === "alert") {
        const alert = event.payload as TelemetryAlert;
        setTelemetry((prev) => {
          // Avoid duplicate alert titles in feed
          if (prev.alerts.some((a) => a.id === alert.id || a.title === alert.title)) {
            return prev;
          }
          return {
            ...prev,
            alerts: [alert, ...prev.alerts.slice(0, 5)],
          };
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return telemetry;
}
