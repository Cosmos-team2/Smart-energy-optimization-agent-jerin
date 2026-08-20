"use client";

import { Home, MapPin, Box, Activity, ShieldCheck } from "lucide-react";

interface NavBarProps {
  visible: boolean;
  activeSection?: string;
  onHero: () => void;
  onMap: () => void;
  onTwin: () => void;
  onDashboard: () => void;
  onApproval: () => void;
}

export function NavBar({
  visible,
  activeSection,
  onHero,
  onMap,
  onTwin,
  onDashboard,
  onApproval,
}: NavBarProps) {
  const navItems = [
    { id: "hero", label: "01 · Hero", icon: Home, onClick: onHero },
    { id: "map", label: "02 · Site Map", icon: MapPin, onClick: onMap },
    { id: "twin", label: "03 · 3D Twin", icon: Box, onClick: onTwin },
    { id: "dashboard", label: "04 · Telemetry", icon: Activity, onClick: onDashboard },
    { id: "approval", label: "05 · Approval", icon: ShieldCheck, onClick: onApproval },
  ];

  return (
    <nav
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out ${
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 -translate-y-4 pointer-events-none"
      }`}
    >
      <div
        className="flex items-center gap-1 p-1.5 rounded-full shadow-2xl backdrop-blur-xl border border-purple-500/25 bg-slate-950/85"
        style={{
          boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.15)",
        }}
      >
        {navItems.map(({ id, label, icon: Icon, onClick }) => {
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              onClick={onClick}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                isActive
                  ? "bg-purple-600/30 text-white border border-purple-500/40 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <Icon
                className={`h-3.5 w-3.5 ${
                  isActive ? "text-purple-400" : "text-slate-400 group-hover:text-purple-400"
                }`}
              />
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
