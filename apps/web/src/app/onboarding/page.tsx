"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MapPin, ArrowRight, Loader2, CheckCircle2, Sparkles, Building } from "lucide-react";
import { apiService } from "@/services/apiService";
import { PRESETS, getPresetById } from "../../../../../packages/shared/facility-presets";

function OnboardingContent() {
  const searchParams = useSearchParams();
  const facilityId = searchParams?.get("facilityId") || "f_001";
  const matchedPreset = getPresetById(facilityId);

  const [address, setAddress] = useState(
    matchedPreset?.address || "Plot 42, Electronic City Phase 1, Bengaluru, Karnataka 560100"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);

  // Progressive check stages during the 2s simulated site verification
  const checkStages = [
    "Geocoding facility coordinates via OSM...",
    "Querying Open-Meteo & NASA POWER Solar GHI...",
    "Analyzing DISCOM 15-min Peak Demand Tariff Rules...",
    "Digital twin initialized. Redirecting to twin...",
  ];

  /**
   * Submit Handler
   * Encapsulates the geocode -> MCP context fan-out pipeline.
   * Redirects to Twin with facility context in URL params.
   */
  const handleSiteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim() || isLoading) return;

    setIsLoading(true);
    setStageIndex(0);

    // Staged animation progress
    const stageInterval = setInterval(() => {
      setStageIndex((prev) => (prev < checkStages.length - 1 ? prev + 1 : prev));
    }, 450);

    try {
      // Structure call: triggers geocode -> MCP context fan-out via apiService
      await apiService.onboardSiteGeocode(address);
    } catch (err) {
      console.error("Geocoding / MCP onboarding error:", err);
    } finally {
      clearInterval(stageInterval);
      const preset = PRESETS.find((p) => p.facilityId === facilityId) || matchedPreset || PRESETS[0];
      window.location.href = `http://localhost:5174/?facilityId=${facilityId}&lat=${preset.lat}&lon=${preset.lon}&discom=${encodeURIComponent(preset.discom)}`;
    }
  };

  return (
    <div className="min-h-[78vh] flex items-center justify-center px-4">
      <div className="w-full max-w-xl">
        {/* Decorative backdrop glow */}
        <div className="relative">
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Main Card */}
          <div className="relative glass-panel rounded-2xl p-8 sm:p-10 shadow-2xl border border-white/10">
            {/* Header Badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                <Sparkles className="w-3.5 h-3.5" />
                Zero-Hardware Onboarding
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              Connect Facility
            </h1>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed">
              Enter your facility or factory address. OptiGrid synthesizes solar irradiance, weather patterns, and DISCOM tariff rules in seconds without requiring hardware retrofits.
            </p>

            {/* Single Input + Submit Form */}
            <form onSubmit={handleSiteSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="facility-address"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2"
                >
                  Facility Address
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <MapPin className="h-5 w-5 text-emerald-400" />
                  </div>
                  <input
                    type="text"
                    id="facility-address"
                    name="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={isLoading}
                    placeholder="Enter industrial park or commercial campus address..."
                    className="block w-full rounded-xl border border-slate-700/80 bg-slate-900/90 pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50"
                    required
                  />
                </div>
              </div>

              {/* Submit Button & Loading State */}
              <button
                type="submit"
                id="submit-onboarding-btn"
                disabled={isLoading || !address.trim()}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-slate-950" />
                    <span>Checking your site...</span>
                  </>
                ) : (
                  <>
                    <span>Evaluate Facility & Enter Dashboard</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Simulated Live Loading Stepper */}
            {isLoading && (
              <div className="mt-6 pt-6 border-t border-slate-800/80 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="h-2 flex-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-300"
                      style={{ width: `${((stageIndex + 1) / checkStages.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-semibold">
                    {Math.round(((stageIndex + 1) / checkStages.length) * 100)}%
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-300 font-mono">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 animate-pulse flex-shrink-0" />
                  <span className="truncate">{checkStages[stageIndex]}</span>
                </div>
              </div>
            )}

            {/* Quick Demo Pre-fills */}
            {!isLoading && (
              <div className="mt-6 pt-5 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Building className="w-3.5 h-3.5" /> Sample:
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setAddress("Plot 42, Electronic City Phase 1, Bengaluru, Karnataka 560100")
                  }
                  className="text-emerald-400 hover:text-emerald-300 hover:underline font-medium"
                >
                  Bengaluru Tech Park (f_001)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[78vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
