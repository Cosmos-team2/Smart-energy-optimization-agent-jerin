/**
 * WebSocket Telemetry & Event Client
 * Conforms to Contract 2: WebSocketEvent
 * Automatically attempts live connection or falls back to synthetic streaming.
 */

import { WebSocketEvent, SeedDataRecord, TelemetryAlert } from "@/types/contracts";
import { SEED_DEMAND_CURVE } from "./apiService";

export type EventCallback = (event: WebSocketEvent) => void;

export class TelemetryWebSocketClient {
  private ws: WebSocket | null = null;
  private subscribers: Set<EventCallback> = new Set();
  private intervalTimer: NodeJS.Timeout | null = null;
  private isConnected = false;
  private isDisconnecting = false;
  private currentIndex = 7; // Start near the 06:00 AM spike event

  constructor(
    private url: string = process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace(/^http/, "ws") + "/ws/telemetry"
      : "ws://127.0.0.1:8000/ws/telemetry"
  ) {}

  public connect() {
    if (typeof window === "undefined") return;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.broadcastStatus(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed: WebSocketEvent = JSON.parse(event.data);
          this.notifySubscribers(parsed);
        } catch {
          // ignore
        }
      };

      this.ws.onerror = () => {
        this.startSyntheticStream();
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        if (!this.isDisconnecting) {
          this.startSyntheticStream();
        }
      };
    } catch {
      this.startSyntheticStream();
    }
  }

  public subscribe(cb: EventCallback): () => void {
    this.subscribers.add(cb);
    return () => {
      this.subscribers.delete(cb);
    };
  }

  private notifySubscribers(event: WebSocketEvent) {
    this.subscribers.forEach((cb) => cb(event));
  }

  private broadcastStatus(connected: boolean) {
    const statusEvent: WebSocketEvent<{ status: string }> = {
      event: "status",
      facility_id: "f_001",
      timestamp: new Date().toISOString(),
      payload: { status: connected ? "connected" : "simulated_live" },
    };
    this.notifySubscribers(statusEvent);
  }

  public startSyntheticStream() {
    if (this.intervalTimer) return;

    this.intervalTimer = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % SEED_DEMAND_CURVE.length;
      const baseReading = SEED_DEMAND_CURVE[this.currentIndex];

      // Add slight jitter for dynamic live telemetry effect (+/- 1.5%)
      const jitter = (Math.random() - 0.5) * 6;
      const total_kw = Number((baseReading.total_kw + jitter).toFixed(2));
      const optimized_kw = Number(((baseReading.optimized_kw || baseReading.total_kw) + jitter * 0.4).toFixed(2));

      const updatedReading: SeedDataRecord = {
        ...baseReading,
        total_kw,
        optimized_kw,
        temp_celsius: Number((baseReading.temp_celsius + (Math.random() - 0.5) * 0.4).toFixed(1)),
      };

      const readingEvent: WebSocketEvent<SeedDataRecord> = {
        event: "reading",
        facility_id: "f_001",
        zone_id: "z_hvac_3",
        timestamp: new Date().toISOString(),
        payload: updatedReading,
      };

      this.notifySubscribers(readingEvent);

      // Randomly emit or refresh alert when peak spike is approached
      if (total_kw > 500.0 && Math.random() > 0.4) {
        const alertEvent: WebSocketEvent<TelemetryAlert> = {
          event: "alert",
          facility_id: "f_001",
          zone_id: "z_hvac_3",
          timestamp: new Date().toISOString(),
          payload: {
            id: `alt_${Date.now()}`,
            title: "Demand Spike Forecast > 500 kW Limit",
            message: `Instantaneous demand spiked to ${total_kw} kW. Exceeds BESCOM contract limit.`,
            timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
            severity: "critical",
            peak_kw: total_kw,
            limit_kw: 500.0,
            recommendation_id: "rec_042",
          },
        };
        this.notifySubscribers(alertEvent);
      }
    }, 3500);
  }

  public disconnect() {
    this.isDisconnecting = true;
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }
}

// Global telemetry singleton
export const telemetryWS = new TelemetryWebSocketClient();
