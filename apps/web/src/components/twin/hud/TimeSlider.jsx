import { COLORS } from "../palette.js";

// Scrubs through spike-data.json's real timeline entries (2017-01-02, 05:00-06:45).
export default function TimeSlider({ timeline, index, onChange }) {
  const current = timeline[index];
  const time = current.datetime.slice(11, 16);
  const date = current.datetime.slice(0, 10);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(560px, 82vw)",
        padding: "12px 20px",
        background: "rgba(16,12,26,0.78)",
        border: `1px solid ${COLORS.purpleTrace}`,
        borderRadius: 10,
        color: COLORS.white,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        backdropFilter: "blur(8px)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.45)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, opacity: 0.7, marginBottom: 6 }}>
        <span>{date}</span>
        <span style={{ fontWeight: 600, color: COLORS.purpleGlow }}>{time}</span>
      </div>
      <input
        type="range"
        min={0}
        max={timeline.length - 1}
        step={1}
        value={index}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: COLORS.purple }}
      />
    </div>
  );
}
