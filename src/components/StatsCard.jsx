import React from "react";

const s = {
  card: {
    background: "#fff",
    borderRadius: 14,
    padding: "22px 24px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05), 0 4px 14px rgba(0,0,0,0.03)",
    border: "1px solid #e5e7eb",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  top: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 },
  title: { margin: 0, textTransform: "uppercase", letterSpacing: "0.12em", fontSize: "0.7rem", fontWeight: 700, color: "#1d4ed8" },
  value: { fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" },
  subtitle: { marginTop: 10, color: "#64748b", fontSize: "0.82rem", lineHeight: 1.5 },
};

function StatsCard({ title, value, subtitle }) {
  return (
    <div style={s.card}>
      <div style={s.top}>
        <p style={s.title}>{title}</p>
        <strong style={s.value}>{value}</strong>
      </div>
      {subtitle && <p style={s.subtitle}>{subtitle}</p>}
    </div>
  );
}

export default StatsCard;
