// 500.0 kW is the contract limit cited in rec_042.json's reasoning text:
// "...exceeding the 500.0 kW contract limit." Extracted here, not invented.
//
// Shared between apps/twin (Digital Twin) and apps/hero (marketing hero),
// which both display this figure — kept in one place so there's a single
// source of truth for it, not two copies that could drift.
export const CONTRACT_LIMIT_KW = 500.0;
