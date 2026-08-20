/**
 * Smart Energy Optimization Agent - Canonical Contracts & Types
 * Mirrored from packages/contracts/types.ts
 */

// ==========================================
// 1. Contract 4: MCP Tool Envelope
// ==========================================

export interface Location {
  lat: number;
  lon: number;
}

export interface MCPEnvelope<T = Record<string, any>> {
  source: string; // e.g. "open-meteo", "nasa-power", "discom-rules", "osm-overpass"
  timestamp: string; // ISO 8601 IST timestamp
  location?: Location | null;
  payload: T;
  confidence: number; // 0.0 to 1.0
}

// Weather / Environment Payload shape for MCP Weather context
export interface WeatherMCPPayload {
  temp_celsius: number;
  humidity_pct: number;
  solar_ghi: number;
  tod_rate_inr: number;
  demand_charge_rate_inr: number;
  condition?: string;
  station_name?: string;
}

// ==========================================
// 2. Contract 3: Recommendation Object
// ==========================================

export type RecommendationType = "composite" | "sequence" | "shift" | "solar_advisory";

export type RecommendationStatus = "proposed" | "approved" | "rejected" | "executed";

export interface ActionDetail {
  action_type: string; // e.g. "pre_cool", "delay_start", "soft_ramp"
  target_equipment?: string | null;
  target_zone?: string | null;
  delay_minutes?: number | null;
  temp_delta_celsius?: number | null;
  ramp_cap_pct?: number | null;
  time_window?: string | null;
  description?: string;
}

export interface RecommendationObject {
  id: string; // e.g. "rec_042"
  type: RecommendationType;
  target: string[];
  actions: ActionDetail[];
  estimated_savings_inr: number;
  spike_risk_reduction_pct: number;
  baseline_peak_kw: number;
  optimized_peak_kw: number;
  reasoning: string;
  cited_rule: string;
  confidence: number; // 0.0 to 1.0
  requires_approval: boolean;
  status: RecommendationStatus;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
}

// ==========================================
// 3. Contract 2: WebSocket Event Schema
// ==========================================

export type WebSocketEventType = "reading" | "alert" | "recommendation" | "approval_update" | "status";

export interface WebSocketEvent<T = Record<string, any>> {
  event: WebSocketEventType;
  facility_id: string; // e.g. "f_001"
  zone_id?: string | null; // e.g. "z_hvac_3"
  timestamp: string;
  payload: T;
}

// Alert Payload inside WebSocketEvent
export interface TelemetryAlert {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  severity: "critical" | "warning" | "info";
  zone_id?: string;
  equipment_id?: string;
  recommendation_id?: string;
  peak_kw?: number;
  limit_kw?: number;
}

// ==========================================
// 4. Contract 1: Entity Model
// ==========================================

export interface Equipment {
  id: string; // e.g. "eq_chiller_2", "eq_comp_1"
  zone_id: string;
  name: string;
  type: string; // "hvac", "compressor", "motor", "solar_pv"
  rated_power_kw: number;
  current_status?: "running" | "idle" | "throttled" | "pre_cooling";
  current_load_kw?: number;
}

export interface Zone {
  id: string; // e.g. "z_hvac_3"
  facility_id: string;
  name: string;
  equipments: Equipment[];
  current_temp_celsius?: number;
  target_temp_celsius?: number;
}

export interface Facility {
  id: string; // e.g. "f_001"
  name: string;
  address: string;
  location?: Location | null;
  contract_demand_kw?: number;
  zones: Zone[];
}

// ==========================================
// 5. Contract 5: Seed Dataset Record
// ==========================================

export interface SeedDataRecord {
  Datetime: string;
  PJME_MW?: number | null;
  total_kw: number;
  base_kw: number;
  hvac_kw: number;
  comp_kw: number;
  is_spike_event: number; // 0 or 1
  temp_celsius: number;
  humidity_pct: number;
  solar_ghi: number;
  tod_rate_inr: number;
  is_peak_hour_flag: number; // 0 or 1
  demand_charge_rate_inr: number;
  optimized_kw?: number;
}

// Onboarding Payload
export interface OnboardingSiteResult {
  address: string;
  facility_id: string;
  facility_name: string;
  coordinates: Location;
  discom: string;
  contract_limit_kw: number;
  baseline_peak_kw: number;
  potential_monthly_savings_inr: number;
  tariff_scheme: string;
}
