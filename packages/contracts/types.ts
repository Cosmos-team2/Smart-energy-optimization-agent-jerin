/**
 * Smart Energy Consumption Optimization Agent - Data Contracts & Types
 * Mirrored from Python Pydantic Source of Truth (packages/contracts/models.py)
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
}

// ==========================================
// 3. Contract 2: WebSocket Event Schema
// ==========================================

export type WebSocketEventType = "reading" | "alert" | "recommendation" | "approval_update";

export interface WebSocketEvent<T = Record<string, any>> {
  event: WebSocketEventType;
  facility_id: string; // e.g. "f_001"
  zone_id?: string | null; // e.g. "z_hvac_3"
  timestamp: string;
  payload: T;
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
}

export interface Zone {
  id: string; // e.g. "z_hvac_3"
  facility_id: string;
  name: string;
  equipments: Equipment[];
}

export interface Facility {
  id: string; // e.g. "f_001"
  name: string;
  address: string;
  location?: Location | null;
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
}
