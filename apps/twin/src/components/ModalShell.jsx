import { useEffect } from "react";
import { COLORS } from "../hero/palette.js";

// Shared shell for every OptiGrid modal (Demo, Sign In, How It Works) —
// backdrop, panel chrome, close button, escape-to-close. Keeps the three
// modals visually consistent without duplicating this boilerplate three
// times.
export default function ModalShell({ open, onClose, children, maxWidth = 420 }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(5,4,10,0.72)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth,
          background: "linear-gradient(180deg, #12101d 0%, #0b0913 100%)",
          border: "1px solid rgba(139,92,246,0.25)",
          borderRadius: 14,
          padding: "30px 28px 26px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 40px rgba(139,92,246,0.08)",
          position: "relative",
          fontFamily: "'Inter', system-ui, sans-serif",
          animation: "optigrid-modal-in 0.22s ease",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 28,
            height: 28,
            borderRadius: 8,
            border: "1px solid rgba(240,237,255,0.12)",
            background: "rgba(255,255,255,0.03)",
            color: "rgba(240,237,255,0.6)",
            cursor: "pointer",
            fontSize: 13,
            lineHeight: 1,
          }}
        >
          ✕
        </button>
        {children}
        <style>{`
          @keyframes optigrid-modal-in {
            from { opacity: 0; transform: translateY(10px) scale(0.98); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>
      </div>
    </div>
  );
}

export const fieldLabelStyle = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.8,
  color: "rgba(240,237,255,0.5)",
  textTransform: "uppercase",
  marginBottom: 6,
};

export const fieldInputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid rgba(240,237,255,0.14)",
  background: "rgba(255,255,255,0.03)",
  color: COLORS.white,
  fontSize: 13.5,
  fontFamily: "'Inter', system-ui, sans-serif",
  outline: "none",
  marginBottom: 16,
};

export const submitButtonStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: 8,
  border: "1px solid rgba(139,92,246,0.6)",
  background: "linear-gradient(135deg, rgba(139,92,246,0.95), rgba(109,40,217,0.95))",
  color: "#fff",
  fontWeight: 700,
  fontSize: 12.5,
  letterSpacing: 0.8,
  textTransform: "uppercase",
  cursor: "pointer",
  marginTop: 2,
  fontFamily: "'Inter', system-ui, sans-serif",
};
