import { useState } from "react";
import ModalShell, { fieldLabelStyle, fieldInputStyle, submitButtonStyle } from "./ModalShell.jsx";
import { COLORS } from "../hero/palette.js";

const EMPTY = { name: "", email: "", company: "", facilityType: "" };

// UI-prototype only — no backend. Submitting just flips to a success state.
export default function DemoModal({ open, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [submitted, setSubmitted] = useState(false);

  function handleClose() {
    onClose();
    setTimeout(() => {
      setSubmitted(false);
      setForm(EMPTY);
    }, 250);
  }

  function set(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  return (
    <ModalShell open={open} onClose={handleClose} maxWidth={440}>
      {!submitted ? (
        <>
          <h2
            style={{
              margin: "0 0 6px",
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 22,
              fontWeight: 700,
              color: COLORS.white,
            }}
          >
            See OptiGrid in action.
          </h2>
          <p style={{ margin: "0 0 22px", fontSize: 13, lineHeight: 1.5, color: COLORS.textMuted }}>
            Tell us about your facility and we'll set up a walkthrough.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
          >
            <label style={fieldLabelStyle}>Name</label>
            <input required style={fieldInputStyle} value={form.name} onChange={set("name")} />

            <label style={fieldLabelStyle}>Work Email</label>
            <input required type="email" style={fieldInputStyle} value={form.email} onChange={set("email")} />

            <label style={fieldLabelStyle}>Company</label>
            <input required style={fieldInputStyle} value={form.company} onChange={set("company")} />

            <label style={fieldLabelStyle}>Facility Type</label>
            <input
              style={fieldInputStyle}
              placeholder="Commercial, Industrial, Campus…"
              value={form.facilityType}
              onChange={set("facilityType")}
            />

            <button type="submit" style={submitButtonStyle}>
              Request Demo →
            </button>
          </form>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "22px 0 10px" }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "1px solid rgba(139,92,246,0.4)",
              background: "rgba(139,92,246,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: 18,
              color: COLORS.purpleGlow,
            }}
          >
            ✓
          </div>
          <h2
            style={{
              margin: "0 0 8px",
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 19,
              fontWeight: 700,
              color: COLORS.white,
            }}
          >
            Thanks — we'll be in touch.
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: COLORS.textMuted }}>
            Our team will reach out shortly to schedule your walkthrough.
          </p>
        </div>
      )}
    </ModalShell>
  );
}
