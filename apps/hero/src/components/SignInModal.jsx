import { useState } from "react";
import ModalShell, { fieldLabelStyle, fieldInputStyle, submitButtonStyle } from "./ModalShell.jsx";
import { COLORS } from "../palette.js";

// UI prototype only — no authentication is implemented.
export default function SignInModal({ open, onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleClose() {
    onClose();
    setTimeout(() => {
      setEmail("");
      setPassword("");
    }, 250);
  }

  return (
    <ModalShell open={open} onClose={handleClose} maxWidth={380}>
      <h2
        style={{
          margin: "0 0 22px",
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 20,
          fontWeight: 700,
          color: COLORS.white,
        }}
      >
        OptiGrid Sign In
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleClose();
        }}
      >
        <label style={fieldLabelStyle}>Email</label>
        <input
          required
          type="email"
          style={fieldInputStyle}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label style={fieldLabelStyle}>Password</label>
        <input
          required
          type="password"
          style={fieldInputStyle}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" style={submitButtonStyle}>
          Sign In
        </button>
      </form>
      <p style={{ margin: "16px 0 0", fontSize: 11.5, color: COLORS.textDim, textAlign: "center" }}>
        This is a UI preview — authentication is not yet connected.
      </p>
    </ModalShell>
  );
}
