"use client";

import { MapPin, Sparkles, BookOpen } from "lucide-react";

interface NavBarProps {
  visible: boolean;
  onMap: () => void;
  onDashboard: () => void;
  onApproval: () => void;
}

export function NavBar({ visible, onMap, onDashboard, onApproval }: NavBarProps) {
  return (
    <nav
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ease-out ${
        visible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-4 pointer-events-none"
      }`}
    >
      <div
        className="flex items-center gap-1 px-3 py-2 rounded-full shadow-2xl"
        style={{
          background: "rgba(22, 22, 31, 0.92)",
          border: "1px solid rgba(139,92,246,0.22)",
          backdropFilter: "blur(24px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.10)",
        }}
      >
        {[
          { label: "Site Map",  icon: MapPin,    onClick: onMap },
          { label: "Dashboard", icon: Sparkles,  onClick: onDashboard },
          { label: "Approval",  icon: BookOpen,  onClick: onApproval },
        ].map(({ label, icon: Icon, onClick }, i) => (
          <button
            key={label}
            onClick={onClick}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all"
            style={{ color: "var(--color-muted)", letterSpacing: "0.03em" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = "#fff";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(139,92,246,0.12)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--color-muted)";
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            <Icon className="h-3.5 w-3.5" style={{ color: "var(--color-accent-1)" }} />
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
