/**
 * Verification test script: 3D Twin & MCP State Consistency Audit
 * Validates that MCP state mappings, inferScenario(), and fault scenario generators
 * produce valid 3D scene step structures without missing parameters or invalid colors/badges.
 */

import {
  inferScenario,
} from "../apps/web/src/hooks/useMCPState";

import {
  SCENARIO_SIMULTANEOUS_SPIKE,
  SCENARIO_COMPRESSOR_FAULT,
  SCENARIO_META,
  buildDemandBreachSteps,
  buildHVACThermalSteps,
  buildStaggerSteps,
} from "../apps/web/src/components/twin/data/faultScenarios";

let errors: string[] = [];
let passes = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    errors.push(`FAIL: ${message}`);
  } else {
    passes++;
  }
}

console.log("=== STARTING 3D TWIN <-> MCP STATE CONSISTENCY AUDIT ===\n");

// 1. Test Scenario Inference Logic
console.log("--- 1. Testing inferScenario() for MCP Outputs ---");

// Test Heatwave trigger
const s1 = inferScenario({ ambientTempC: 41.5, heatwaveFlag: true });
assert(s1 === "hvac_thermal", `Heatwave/41.5°C should infer 'hvac_thermal', got '${s1}'`);

// Test Tight Contract Limit trigger (e.g. 400 kW limit)
const s2 = inferScenario({ contractLimitKw: 400, ambientTempC: 32 });
assert(s2 === "demand_breach", `Contract limit 400 kW should infer 'demand_breach', got '${s2}'`);

// Test Severe IsolationForest Anomaly trigger
const s3 = inferScenario({ anomalyScore: -0.65, contractLimitKw: 500, ambientTempC: 32 });
assert(s3 === "compressor_fault", `Anomaly score -0.65 should infer 'compressor_fault', got '${s3}'`);

// Test Relaxed Limit Stagger Applied trigger
const s4 = inferScenario({ contractLimitKw: 550, ambientTempC: 32 });
assert(s4 === "stagger_applied", `Contract limit 550 kW should infer 'stagger_applied', got '${s4}'`);

console.log(`Passed ${passes} inference assertion checks.`);

// 2. Test Step Generation Consistency
console.log("\n--- 2. Testing Fault Scenario Step Generators ---");

const sampleMcpState = {
  contractLimitKw: 450,
  optimizedPeakKw: 410.5,
  monthlySavingsInr: 165000,
  compressorDelayMin: 20,
  chillerRampPct: 45,
  ambientTempC: 39.2,
  heatwaveFlag: true,
  anomalyScore: -0.48,
  lastRunTimestamp: "2026-08-21T02:00:00+05:30",
  activeScenario: "stagger_applied" as const,
  hasRunMCP: true,
};

// Test buildDemandBreachSteps
const demandSteps = buildDemandBreachSteps(sampleMcpState.contractLimitKw, sampleMcpState.monthlySavingsInr);
assert(demandSteps.length === 5, `Demand breach steps count should be 5, got ${demandSteps.length}`);
assert(demandSteps[2].label.includes("450 kW"), "Step 3 label should reflect 450 kW limit");
assert(demandSteps[2].faultOverlay?.type === "breach", "Step 3 fault overlay type should be 'breach'");

// Test buildHVACThermalSteps
const thermalSteps = buildHVACThermalSteps(sampleMcpState.ambientTempC, sampleMcpState.heatwaveFlag);
assert(thermalSteps.length === 5, `HVAC thermal steps count should be 5, got ${thermalSteps.length}`);
assert(thermalSteps[0].label.includes("39.2°C"), "Step 1 label should reflect 39.2°C ambient");
assert(thermalSteps[0].faultOverlay?.message.includes("HEATWAVE ACTIVE"), "Overlay should call out HEATWAVE ACTIVE");

// Test buildStaggerSteps
const staggerSteps = buildStaggerSteps(sampleMcpState);
assert(staggerSteps.length === 5, `Stagger steps count should be 5, got ${staggerSteps.length}`);
assert(staggerSteps[2].label.includes("45%"), "Step 3 label should reflect 45% chiller ramp cap");
assert(staggerSteps[2].faultOverlay?.penalty?.includes(sampleMcpState.monthlySavingsInr.toLocaleString("en-IN")), `Penalty/savings should reflect ₹${sampleMcpState.monthlySavingsInr.toLocaleString("en-IN")}/mo`);

// 3. Test Metadata Definitions
console.log("\n--- 3. Testing SCENARIO_META completeness ---");
const expectedKeys = ["simultaneous_spike", "demand_breach", "compressor_fault", "hvac_thermal", "stagger_applied"];
for (const key of expectedKeys) {
  assert(!!(SCENARIO_META as any)[key], `SCENARIO_META missing key: ${key}`);
  assert(!!(SCENARIO_META as any)[key].color, `SCENARIO_META key ${key} missing color`);
}

console.log("\n=== AUDIT SUMMARY ===");
if (errors.length === 0) {
  console.log(`✅ ALL ${passes} CONSISTENCY AUDIT TESTS PASSED CLEANLY!`);
} else {
  console.error(`❌ FOUND ${errors.length} FAILURES:`);
  errors.forEach((err) => console.error(`  - ${err}`));
  process.exit(1);
}
