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
        background: "rgba(10,14,20,0.75)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10,
        color: "#e6edf3",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        backdropFilter: "blur(6px)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, opacity: 0.75, marginBottom: 6 }}>
        <span>{date}</span>
        <span style={{ fontWeight: 600 }}>{time}</span>
      </div>
      <input
        type="range"
        min={0}
        max={timeline.length - 1}
        step={1}
        value={index}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%" }}
      />
    </div>
  );
}
