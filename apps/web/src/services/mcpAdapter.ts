/**
 * MCP Context Envelope Adapter
 * Provides unwrapping and normalization for data arriving in MCPEnvelope<T> format.
 */

import { MCPEnvelope, WeatherMCPPayload } from "@/types/contracts";

/**
 * Checks if a response object is wrapped in an MCPEnvelope.
 */
export function isMCPEnvelope<T = any>(obj: any): obj is MCPEnvelope<T> {
  return (
    obj &&
    typeof obj === "object" &&
    "source" in obj &&
    "timestamp" in obj &&
    "payload" in obj &&
    typeof obj.confidence === "number"
  );
}

/**
 * Generic unwrapper function.
 * Extracts the payload from an MCPEnvelope, or returns the raw object if not wrapped.
 */
export function unwrapMCPEnvelope<T = any>(envelopeOrRaw: MCPEnvelope<T> | T | null | undefined): T {
  if (!envelopeOrRaw) {
    return {} as T;
  }

  if (isMCPEnvelope<T>(envelopeOrRaw)) {
    return envelopeOrRaw.payload;
  }

  return envelopeOrRaw as T;
}

/**
 * Extracts metadata (source, confidence, timestamp, location) from an MCP envelope.
 */
export function getMCPExtendedInfo<T = any>(envelopeOrRaw: MCPEnvelope<T> | T | null | undefined) {
  if (isMCPEnvelope<T>(envelopeOrRaw)) {
    return {
      source: envelopeOrRaw.source,
      timestamp: envelopeOrRaw.timestamp,
      location: envelopeOrRaw.location,
      confidence: envelopeOrRaw.confidence,
      isWrapped: true,
    };
  }

  return {
    source: "direct",
    timestamp: new Date().toISOString(),
    location: null,
    confidence: 1.0,
    isWrapped: false,
  };
}

/**
 * Default fallback envelope for Open-Meteo & NASA POWER live context.
 */
export function createMockWeatherEnvelope(): MCPEnvelope<WeatherMCPPayload> {
  return {
    source: "open-meteo + nasa-power",
    timestamp: new Date().toISOString(),
    location: { lat: 12.9716, lon: 77.5946 }, // Bengaluru Tech Park
    confidence: 0.96,
    payload: {
      temp_celsius: 34.8,
      humidity_pct: 58.0,
      solar_ghi: 742.0, // W/m² irradiance
      tod_rate_inr: 9.85, // Peak TOD rate ₹/kWh
      demand_charge_rate_inr: 450.0, // ₹/kVA/month
      condition: "Clear & Sunny (High Cooling Load)",
      station_name: "Electronic City Phase 1 Sensor #04",
    },
  };
}
