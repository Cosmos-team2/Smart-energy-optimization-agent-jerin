/**
 * Unified API Service Module
 * Abstracts all HTTP REST calls behind clean, swappable methods.
 * Connects to the FastAPI backend (http://127.0.0.1:8000) or internal Next.js API routes.
 */

import {
  Facility,
  RecommendationObject,
  SeedDataRecord,
  MCPEnvelope,
  WeatherMCPPayload,
  OnboardingSiteResult,
} from "@/types/contracts";
import { createMockWeatherEnvelope, unwrapMCPEnvelope } from "./mcpAdapter";

// API Base URL - Switchable via environment variable or default
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

// Canonical rec_042 fixture (Contract 3)
export const CANONICAL_REC_042: RecommendationObject = {
  id: "rec_042",
  type: "composite",
  target: ["z_hvac_3", "z_compressor_1"],
  actions: [
    {
      action_type: "pre_cool",
      target_zone: "z_hvac_3",
      temp_delta_celsius: -1.5,
      time_window: "05:00-05:45 AM",
      description: "Pre-cool Zone 3 by 1.5°C before tariff peak to build thermal inertia",
    },
    {
      action_type: "delay_start",
      target_equipment: "eq_comp_1",
      delay_minutes: 20,
      time_window: "06:00-06:20 AM",
      description: "Stagger Screw Air Compressor #1 startup by 20 mins to prevent simultaneous inrush",
    },
    {
      action_type: "soft_ramp",
      target_equipment: "eq_chiller_2",
      ramp_cap_pct: 50.0,
      time_window: "06:00-06:15 AM",
      description: "Soft-ramp Centrifugal Chiller #2 capped at 50% capacity during grid ramp window",
    },
  ],
  estimated_savings_inr: 130000.0,
  spike_risk_reduction_pct: 62.5,
  baseline_peak_kw: 777.71,
  optimized_peak_kw: 420.0,
  reasoning:
    "Simultaneous restart of Chiller #2 (+180 kW) and Compressor #1 (+140 kW) creates a 777.71 kW demand spike between 06:00-06:15 AM, exceeding the 500.0 kW contract limit. Staggering compressor restart to 06:20 AM and pre-cooling Zone HVAC-3 reduces peak load to 420.0 kW.",
  cited_rule: "demand_charge_15min_peak",
  confidence: 0.94,
  requires_approval: true,
  status: "proposed",
};

// Canonical Facility Model (Contract 1)
export const CANONICAL_FACILITY: Facility = {
  id: "f_001",
  name: "Bengaluru Tech Park - Phase 2",
  address: "Plot 42, Electronic City Phase 1, Bengaluru, Karnataka 560100",
  location: { lat: 12.9716, lon: 77.5946 },
  contract_demand_kw: 500.0,
  zones: [
    {
      id: "z_hvac_3",
      facility_id: "f_001",
      name: "HVAC Chillers Zone 3",
      current_temp_celsius: 23.5,
      target_temp_celsius: 22.0,
      equipments: [
        {
          id: "eq_chiller_2",
          zone_id: "z_hvac_3",
          name: "Centrifugal Chiller #2",
          type: "hvac",
          rated_power_kw: 180.0,
          current_status: "running",
          current_load_kw: 145.0,
        },
      ],
    },
    {
      id: "z_compressor_1",
      facility_id: "f_001",
      name: "Compressed Air Station 1",
      equipments: [
        {
          id: "eq_comp_1",
          zone_id: "z_compressor_1",
          name: "Screw Air Compressor #1",
          type: "compressor",
          rated_power_kw: 140.0,
          current_status: "idle",
          current_load_kw: 0.0,
        },
      ],
    },
  ],
};

// 24-Hour 15-minute demand curve seed data (Baseline vs Optimized)
export const SEED_DEMAND_CURVE: SeedDataRecord[] = [
  { Datetime: "00:00", total_kw: 210, base_kw: 140, hvac_kw: 45, comp_kw: 25, is_spike_event: 0, temp_celsius: 24.2, humidity_pct: 70, solar_ghi: 0, tod_rate_inr: 4.5, is_peak_hour_flag: 0, demand_charge_rate_inr: 450, optimized_kw: 210 },
  { Datetime: "01:00", total_kw: 195, base_kw: 135, hvac_kw: 40, comp_kw: 20, is_spike_event: 0, temp_celsius: 23.8, humidity_pct: 72, solar_ghi: 0, tod_rate_inr: 4.5, is_peak_hour_flag: 0, demand_charge_rate_inr: 450, optimized_kw: 195 },
  { Datetime: "02:00", total_kw: 188, base_kw: 130, hvac_kw: 38, comp_kw: 20, is_spike_event: 0, temp_celsius: 23.4, humidity_pct: 74, solar_ghi: 0, tod_rate_inr: 4.5, is_peak_hour_flag: 0, demand_charge_rate_inr: 450, optimized_kw: 188 },
  { Datetime: "03:00", total_kw: 180, base_kw: 130, hvac_kw: 30, comp_kw: 20, is_spike_event: 0, temp_celsius: 23.0, humidity_pct: 75, solar_ghi: 0, tod_rate_inr: 4.5, is_peak_hour_flag: 0, demand_charge_rate_inr: 450, optimized_kw: 180 },
  { Datetime: "04:00", total_kw: 192, base_kw: 132, hvac_kw: 40, comp_kw: 20, is_spike_event: 0, temp_celsius: 22.8, humidity_pct: 76, solar_ghi: 0, tod_rate_inr: 4.5, is_peak_hour_flag: 0, demand_charge_rate_inr: 450, optimized_kw: 192 },
  { Datetime: "05:00", total_kw: 245, base_kw: 140, hvac_kw: 85, comp_kw: 20, is_spike_event: 0, temp_celsius: 23.2, humidity_pct: 73, solar_ghi: 15, tod_rate_inr: 5.5, is_peak_hour_flag: 0, demand_charge_rate_inr: 450, optimized_kw: 290 }, // pre-cool ramp
  { Datetime: "05:30", total_kw: 310, base_kw: 150, hvac_kw: 135, comp_kw: 25, is_spike_event: 0, temp_celsius: 24.5, humidity_pct: 69, solar_ghi: 85, tod_rate_inr: 6.0, is_peak_hour_flag: 0, demand_charge_rate_inr: 450, optimized_kw: 345 },
  { Datetime: "06:00", total_kw: 777.71, base_kw: 240, hvac_kw: 280, comp_kw: 257.71, is_spike_event: 1, temp_celsius: 26.0, humidity_pct: 65, solar_ghi: 210, tod_rate_inr: 9.85, is_peak_hour_flag: 1, demand_charge_rate_inr: 450, optimized_kw: 420.0 }, // STAGGERED SPIKE!
  { Datetime: "06:30", total_kw: 620, base_kw: 235, hvac_kw: 225, comp_kw: 160, is_spike_event: 1, temp_celsius: 27.8, humidity_pct: 62, solar_ghi: 360, tod_rate_inr: 9.85, is_peak_hour_flag: 1, demand_charge_rate_inr: 450, optimized_kw: 410.0 },
  { Datetime: "07:00", total_kw: 490, base_kw: 220, hvac_kw: 180, comp_kw: 90, is_spike_event: 0, temp_celsius: 29.5, humidity_pct: 58, solar_ghi: 510, tod_rate_inr: 9.85, is_peak_hour_flag: 1, demand_charge_rate_inr: 450, optimized_kw: 435.0 },
  { Datetime: "08:00", total_kw: 460, base_kw: 215, hvac_kw: 175, comp_kw: 70, is_spike_event: 0, temp_celsius: 31.2, humidity_pct: 54, solar_ghi: 680, tod_rate_inr: 9.85, is_peak_hour_flag: 1, demand_charge_rate_inr: 450, optimized_kw: 430.0 },
  { Datetime: "09:00", total_kw: 475, base_kw: 220, hvac_kw: 185, comp_kw: 70, is_spike_event: 0, temp_celsius: 32.8, humidity_pct: 51, solar_ghi: 820, tod_rate_inr: 9.85, is_peak_hour_flag: 1, demand_charge_rate_inr: 450, optimized_kw: 440.0 },
  { Datetime: "10:00", total_kw: 485, base_kw: 225, hvac_kw: 190, comp_kw: 70, is_spike_event: 0, temp_celsius: 34.0, humidity_pct: 48, solar_ghi: 910, tod_rate_inr: 9.85, is_peak_hour_flag: 1, demand_charge_rate_inr: 450, optimized_kw: 450.0 },
  { Datetime: "12:00", total_kw: 460, base_kw: 210, hvac_kw: 180, comp_kw: 70, is_spike_event: 0, temp_celsius: 35.2, humidity_pct: 45, solar_ghi: 940, tod_rate_inr: 7.5, is_peak_hour_flag: 0, demand_charge_rate_inr: 450, optimized_kw: 430.0 },
  { Datetime: "14:00", total_kw: 450, base_kw: 205, hvac_kw: 175, comp_kw: 70, is_spike_event: 0, temp_celsius: 34.8, humidity_pct: 46, solar_ghi: 840, tod_rate_inr: 7.5, is_peak_hour_flag: 0, demand_charge_rate_inr: 450, optimized_kw: 425.0 },
  { Datetime: "16:00", total_kw: 440, base_kw: 200, hvac_kw: 170, comp_kw: 70, is_spike_event: 0, temp_celsius: 33.0, humidity_pct: 50, solar_ghi: 550, tod_rate_inr: 7.5, is_peak_hour_flag: 0, demand_charge_rate_inr: 450, optimized_kw: 420.0 },
  { Datetime: "18:00", total_kw: 520, base_kw: 230, hvac_kw: 190, comp_kw: 100, is_spike_event: 1, temp_celsius: 30.5, humidity_pct: 56, solar_ghi: 90, tod_rate_inr: 9.85, is_peak_hour_flag: 1, demand_charge_rate_inr: 450, optimized_kw: 460.0 },
  { Datetime: "20:00", total_kw: 410, base_kw: 200, hvac_kw: 140, comp_kw: 70, is_spike_event: 0, temp_celsius: 28.0, humidity_pct: 62, solar_ghi: 0, tod_rate_inr: 9.85, is_peak_hour_flag: 1, demand_charge_rate_inr: 450, optimized_kw: 390.0 },
  { Datetime: "22:00", total_kw: 290, base_kw: 160, hvac_kw: 90, comp_kw: 40, is_spike_event: 0, temp_celsius: 26.2, humidity_pct: 68, solar_ghi: 0, tod_rate_inr: 5.5, is_peak_hour_flag: 0, demand_charge_rate_inr: 450, optimized_kw: 280.0 },
];

/**
 * Service singleton exposing all backend interactions.
 */
export const apiService = {
  /**
   * 1. Onboard Facility / Geocode & Context Fan-Out Simulation
   */
  async onboardSiteGeocode(address: string): Promise<OnboardingSiteResult> {
    // Structure handler for future real geocode -> MCP context fan-out
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return {
      address: address || "Plot 42, Electronic City Phase 1, Bengaluru, Karnataka 560100",
      facility_id: "f_001",
      facility_name: "Bengaluru Tech Park - Phase 2",
      coordinates: { lat: 12.9716, lon: 77.5946 },
      discom: "BESCOM HT-2a Industrial / Commercial",
      contract_limit_kw: 500.0,
      baseline_peak_kw: 777.71,
      potential_monthly_savings_inr: 130000.0,
      tariff_scheme: "Time of Day (TOD) + 15-min Peak Demand Charge",
    };
  },

  /**
   * 2. Facility Entity Metadata
   */
  async getFacility(facilityId: string = "f_001"): Promise<Facility> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/facility/${facilityId}`, {
        cache: "no-store",
      });
      if (res.ok) {
        return await res.json();
      }
      console.warn(`[apiService] getFacility(${facilityId}) backend returned ${res.status}, falling back to canonical fixture`);
    } catch (err) {
      console.warn(`[apiService] getFacility(${facilityId}) backend offline, falling back to canonical fixture:`, err);
    }
    return CANONICAL_FACILITY;
  },

  /**
   * 3. Seed Dataset Telemetry Readings
   */
  async getReadings(limit: number = 24): Promise<SeedDataRecord[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/readings?limit=${limit}`, {
        cache: "no-store",
      });
      if (res.ok) {
        return await res.json();
      }
      console.warn(`[apiService] getReadings backend returned ${res.status}, falling back to seed fixture`);
    } catch (err) {
      console.warn(`[apiService] getReadings backend offline, falling back to seed fixture:`, err);
    }
    return SEED_DEMAND_CURVE.slice(0, limit);
  },

  /**
   * 4. Get Recommendation (Contract 3)
   */
  async getRecommendation(id: string = "rec_042"): Promise<RecommendationObject> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/recommendations/${id}`, {
        cache: "no-store",
      });
      if (res.ok) {
        return await res.json();
      }
      console.warn(`[apiService] getRecommendation(${id}) backend returned ${res.status}, falling back to canonical fixture`);
    } catch (err) {
      console.warn(`[apiService] getRecommendation(${id}) backend offline, falling back to canonical fixture:`, err);
    }
    return CANONICAL_REC_042;
  },

  /**
   * 5. Approve Recommendation (POST /api/recommendations/:id/approve)
   */
  async approveRecommendation(
    id: string = "rec_042"
  ): Promise<{ success: boolean; status: "approved"; message: string; recommendation: RecommendationObject }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/recommendations/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          reviewer: "Facility Manager (Admin)",
          timestamp: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          status: "approved",
          message: data.message || `Recommendation ${id} successfully approved and schedule queued.`,
          recommendation: data.recommendation || { ...CANONICAL_REC_042, status: "approved" },
        };
      }
      console.warn(`[apiService] approveRecommendation(${id}) backend returned ${res.status}, falling back to local simulation`);
    } catch (err) {
      console.warn(`[apiService] approveRecommendation(${id}) backend offline, falling back to local simulation:`, err);
    }

    // Fallback response for standalone/stub execution
    return {
      success: true,
      status: "approved",
      message: `Recommendation ${id} approved. Stagger sequence active.`,
      recommendation: {
        ...CANONICAL_REC_042,
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: "Facility Manager (Admin)",
      },
    };
  },

  /**
   * 6. Reject Recommendation (POST /api/recommendations/:id/reject)
   */
  async rejectRecommendation(
    id: string = "rec_042",
    reason: string = "Operator override: scheduled factory maintenance window"
  ): Promise<{ success: boolean; status: "rejected"; message: string; recommendation: RecommendationObject }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/recommendations/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          reason,
          reviewer: "Facility Manager (Admin)",
          timestamp: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          status: "rejected",
          message: data.message || `Recommendation ${id} has been rejected.`,
          recommendation: data.recommendation || { ...CANONICAL_REC_042, status: "rejected" },
        };
      }
      console.warn(`[apiService] rejectRecommendation(${id}) backend returned ${res.status}, falling back to local simulation`);
    } catch (err) {
      console.warn(`[apiService] rejectRecommendation(${id}) backend offline, falling back to local simulation:`, err);
    }

    // Fallback response for standalone/stub execution
    return {
      success: true,
      status: "rejected",
      message: `Recommendation ${id} rejected. Alert archived.`,
      recommendation: {
        ...CANONICAL_REC_042,
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: "Facility Manager (Admin)",
      },
    };
  },

  /**
   * 7. MCP Context Data (Weather & Solar) wrapped in MCPEnvelope
   */
  async getWeatherMCPContext(): Promise<MCPEnvelope<WeatherMCPPayload>> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/mcp/envelope`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "open-meteo",
          payload: { temp_celsius: 34.8, humidity_pct: 58.0 },
        }),
      });
      if (res.ok) {
        return await res.json();
      }
      console.warn(`[apiService] getWeatherMCPContext backend returned ${res.status}, falling back to mock envelope`);
    } catch (err) {
      console.warn(`[apiService] getWeatherMCPContext backend offline, falling back to mock envelope:`, err);
    }
    return createMockWeatherEnvelope();
  },

  /**
   * 8. AI Copilot (POST /api/copilot)
   */
  async askCopilot(question: string, state?: any): Promise<{ answer: string; intent_routed: boolean }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/copilot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, state }),
      });
      if (res.ok) {
        return await res.json();
      }
      console.warn(`[apiService] askCopilot backend returned ${res.status}, falling back to local Copilot explanation`);
    } catch (err) {
      console.warn(`[apiService] askCopilot backend offline, falling back to local Copilot explanation:`, err);
    }
    // Grounded fallback response for demo continuity
    return {
      answer: `Based on recommendation rec_042 for Bengaluru Tech Park - Phase 2: Simultaneous start of Centrifugal Chiller #2 (+180 kW) and Screw Air Compressor #1 (+140 kW) at 06:00 AM created a 777.71 kW peak demand spike, exceeding the 500.0 kW BESCOM contract demand limit. Staggering compressor startup to 06:20 AM and pre-cooling Zone 3 by 1.5°C limits peak load to 420.0 kW, saving ₹1,30,000/month under BESCOM rule demand_charge_15min_peak.`,
      intent_routed: false,
    };
  },
};
