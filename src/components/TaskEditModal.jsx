import React, { useEffect, useState } from "react";

const PRIORITIES = ["High", "Medium", "Low"];
const STATUSES = ["To Do", "In Progress", "Done"];
const PROGRESS_STEPS = ["Accepted", "Working", "In Review", "Completed"];

const s = {
  overlay: { position: "fixed", inset: 0, background: "rgba(10,15,26,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, zIndex: 1000 },
  card: { width: "100%", maxWidth: 520, background: "#fff", borderRadius: 18, padding: 28, boxShadow: "0 24px 60px rgba(0,0,0,0.2)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { margin: 0, fontSize: "1.15rem", fontWeight: 700 },
  closeBtn: { background: "#f1f5f9", border: "1px solid #e5e7eb", fontSize: "1.2rem", lineHeight: 1, color: "#64748b", padding: "6px 10px", borderRadius: 8, cursor: "pointer" },
  form: { display: "grid", gap: 14 },
  input: { width: "100%", padding: "12px 16px", borderRadius: 9, border: "1.5px solid #d1d5db", background: "#fff", color: "#0f172a", fontSize: "0.88rem", boxSizing: "border-box" },
  textarea: { width: "100%", padding: "12px 16px", borderRadius: 9, border: "1.5px solid #d1d5db", background: "#fff", color: "#0f172a", fontSize: "0.88rem", resize: "vertical", minHeight: 80, boxSizing: "border-box" },
  select: { width: "100%", padding: "12px 16px", borderRadius: 9, border: "1.5px solid #d1d5db", background: "#fff", color: "#0f172a", fontSize: "0.88rem", boxSizing: "border-box" },
  label: { fontSize: "0.78rem", fontWeight: 600, color: "#334155", marginBottom: 4 },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  actions: { display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 },
  btnPrimary: { padding: "11px 20px", borderRadius: 9, background: "#1d4ed8", color: "white", border: "none", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", boxShadow: "0 2px 6px rgba(29,78,216,0.25)" },
  btnSecondary: { padding: "11px 20px", borderRadius: 9, background: "#f1f5f9", color: "#334155", border: "1px solid #d1d5db", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" },
};

function TaskEditModal({ task, onSave, onClose, assigneeLabel = "Assignee email" }) {
  const [form, setForm] = useState({ title: "", description: "", assignee: "", dueDate: "", priority: "Medium", status: "To Do", progress: "Accepted" });

  useEffect(() => {
    if (!task) return;
    setForm({
      title: task.title || "", description: task.description || "",
      assignee: task.assignee || task.assigneeEmpId || "",
      dueDate: task.dueDate || "", priority: task.priority || "Medium",
      status: task.status || "To Do", progress: task.progress || "Accepted",
    });
  }, [task]);

  if (!task) return null;

  const handleSubmit = (e) => { e.preventDefault(); if (!form.title.trim()) return; onSave(form); };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.card} onClick={(e) => e.stopPropagation()}>
        <div style={s.header}>
          <h2 style={s.title}>Edit Task</h2>
          <button style={s.closeBtn} onClick={onClose} aria-label="Close">×</button>
        </div>
        <form onSubmit={handleSubmit} style={s.form}>
          <input style={s.input} placeholder="Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
          <textarea style={s.textarea} placeholder="Description" rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          <input style={s.input} placeholder={assigneeLabel} value={form.assignee} onChange={(e) => setForm((p) => ({ ...p, assignee: e.target.value }))} />
          <input style={s.input} type="date" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} />
          <div style={s.row}>
            <div>
              <label style={s.label}>Priority</label>
              <select style={s.select} value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select>
            </div>
            <div>
              <label style={s.label}>Status</label>
              <select style={s.select} value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>{STATUSES.map((st) => <option key={st}>{st}</option>)}</select>
            </div>
          </div>
          <div>
            <label style={s.label}>Progress</label>
            <select style={s.select} value={form.progress} onChange={(e) => setForm((p) => ({ ...p, progress: e.target.value }))}>{PROGRESS_STEPS.map((st) => <option key={st} value={st}>{st}</option>)}</select>
          </div>
          <div style={s.actions}>
            <button type="button" style={s.btnSecondary} onClick={onClose}>Cancel</button>
            <button type="submit" style={s.btnPrimary}>Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskEditModal;
