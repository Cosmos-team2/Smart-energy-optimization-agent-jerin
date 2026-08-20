"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type ScenarioKey =
  | "simultaneous_spike"
  | "demand_breach"
  | "compressor_fault"
  | "hvac_thermal"
  | "stagger_applied";

export interface MCPState {
  contractLimitKw: number;
  optimizedPeakKw: number;
  monthlySavingsInr: number;
  compressorDelayMin: number;
  chillerRampPct: number;
  ambientTempC: number;
  heatwaveFlag: boolean;
  anomalyScore: number;
  lastRunTimestamp: string | null;
  activeScenario: ScenarioKey;
  hasRunMCP: boolean;
}

const DEFAULT_STATE: MCPState = {
  contractLimitKw: 500,
  optimizedPeakKw: 397.71,
  monthlySavingsInr: 130000,
  compressorDelayMin: 20,
  chillerRampPct: 50,
  ambientTempC: 34.8,
  heatwaveFlag: false,
  anomalyScore: -0.42,
  lastRunTimestamp: null,
  activeScenario: "simultaneous_spike",
  hasRunMCP: false,
};

interface MCPStateContextValue {
  mcpState: MCPState;
  updateMCPState: (patch: Partial<MCPState>) => void;
}

const MCPStateContext = createContext<MCPStateContextValue>({
  mcpState: DEFAULT_STATE,
  updateMCPState: () => {},
});

export function MCPStateProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [mcpState, setMcpState] = useState<MCPState>(DEFAULT_STATE);

  const updateMCPState = useCallback((patch: Partial<MCPState>) => {
    setMcpState((prev) => ({ ...prev, ...patch }));
  }, []);

  return (
    <MCPStateContext.Provider value={{ mcpState, updateMCPState }}>
      {children}
    </MCPStateContext.Provider>
  );
}

export function useMCPState(): MCPStateContextValue {
  return useContext(MCPStateContext);
}

/** Derive which fault scenario best matches a given MCP run result */
export function inferScenario(patch: Partial<MCPState>): ScenarioKey {
  const limit = patch.contractLimitKw ?? 500;
  const temp = patch.ambientTempC ?? 34.8;
  const heatwave = patch.heatwaveFlag ?? false;
  const anomaly = patch.anomalyScore ?? -0.42;

  // Heatwave → HVAC thermal stress
  if (heatwave || temp > 38) return "hvac_thermal";
  // Very tight limit → demand breach scenario
  if (limit <= 420) return "demand_breach";
  // Anomaly extremely critical
  if (anomaly < -0.5) return "compressor_fault";
  // Relaxed limit (above baseline peak zone) → show the stagger solution
  if (limit >= 450) return "stagger_applied";
  // Default
  return "demand_breach";
}
