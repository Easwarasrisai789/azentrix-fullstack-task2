import React from "react";

const statusColors = {
  "To Do": "#1d4ed8",
  "In Progress": "#d97706",
  "Done": "#059669",
};

function BoardColumn({ title, children, onDragOver, onDrop }) {
  const baseTitle = Object.keys(statusColors).find((s) => title.startsWith(s));
  const accentColor = statusColors[baseTitle] || "#64748b";

  return (
    <div
      style={{
        flex: 1,
        minWidth: 300,
        background: "#ffffff",
        borderRadius: 14,
        padding: 20,
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: accentColor }} />
        <h3 style={{ margin: 0, fontSize: "0.8rem", fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {title}
        </h3>
      </div>
      <div style={{ display: "grid", gap: 12, minHeight: 60 }}>{children}</div>
    </div>
  );
}

export default BoardColumn;
