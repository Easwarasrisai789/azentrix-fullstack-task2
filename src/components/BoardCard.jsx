import React from "react";

const s = {
  card: {
    background: "#fff",
    borderRadius: 14,
    padding: 24,
    boxShadow: "0 1px 4px rgba(0,0,0,0.05), 0 4px 14px rgba(0,0,0,0.03)",
    border: "1px solid #e5e7eb",
    display: "grid",
    gap: 14,
    minHeight: 130,
    position: "relative",
    overflow: "hidden",
  },
  bar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: "linear-gradient(90deg, #4f46e5, #8b5cf6)",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 9,
    background: "linear-gradient(135deg, #1d4ed8, #7c3aed)",
    display: "grid",
    placeItems: "center",
    color: "white",
    fontWeight: 700,
    fontSize: "0.85rem",
    flexShrink: 0,
  },
  title: { margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" },
  desc: { margin: 0, color: "#64748b", lineHeight: 1.6, fontSize: "0.88rem" },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingTop: 10,
    borderTop: "1px solid #f1f5f9",
  },
  footerText: { color: "#94a3b8", fontSize: "0.75rem" },
  badge: {
    padding: "4px 10px",
    borderRadius: 999,
    background: "#f1f5f9",
    color: "#475569",
    fontSize: "0.7rem",
    fontWeight: 600,
  },
  btnDelete: {
    padding: "6px 12px",
    fontSize: "0.72rem",
    borderRadius: 7,
    background: "#fee2e2",
    color: "#dc2626",
    border: "1px solid #fecaca",
    fontWeight: 600,
    cursor: "pointer",
  },
};

function BoardCard({ board, onDelete, isAdmin }) {
  return (
    <article style={s.card}>
      <div style={s.bar} />
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={s.avatar}>{board.name?.charAt(0).toUpperCase() || "P"}</div>
          <h3 style={s.title}>{board.name}</h3>
        </div>
        <p style={s.desc}>{board.description || "No description provided."}</p>
      </div>
      <div style={s.footer}>
        <span style={s.footerText}>Created by {board.createdByEmail || "unknown"}</span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={s.badge}>Project</span>
          {isAdmin && onDelete && (
            <button style={s.btnDelete} onClick={(e) => { e.stopPropagation(); onDelete(board); }}>Delete</button>
          )}
        </div>
      </div>
    </article>
  );
}

export default BoardCard;
