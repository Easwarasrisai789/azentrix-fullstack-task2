import React from "react";

const PROGRESS_STEPS = ["Accepted", "Working", "In Review", "Completed"];

const s = {
  card: {
    background: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    border: "1px solid #e5e7eb",
    cursor: "grab",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 },
  title: { margin: 0, fontSize: "0.9rem", fontWeight: 600, color: "#0f172a" },
  desc: { margin: "4px 0 0", color: "#64748b", fontSize: "0.8rem", lineHeight: 1.4 },
  badge: { padding: "3px 9px", borderRadius: 999, fontSize: "0.68rem", fontWeight: 700, color: "white", whiteSpace: "nowrap" },
  meta: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 10, borderTop: "1px solid #f1f5f9", color: "#94a3b8", fontSize: "0.75rem" },
  actions: { display: "flex", gap: 6, marginTop: 12 },
  btnEdit: { padding: "6px 12px", borderRadius: 7, fontSize: "0.75rem", fontWeight: 500, background: "#f1f5f9", border: "1px solid #d1d5db", color: "#374151", cursor: "pointer" },
  btnDelete: { padding: "6px 12px", borderRadius: 7, fontSize: "0.75rem", fontWeight: 500, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", cursor: "pointer" },
  stepper: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", margin: "14px 0 6px", position: "relative", padding: "0 4px" },
  step: { display: "flex", flexDirection: "column", alignItems: "center", gap: 3, zIndex: 1, flex: 1 },
  dot: { width: 22, height: 22, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: "0.6rem", fontWeight: 700, background: "#e5e7eb", color: "#9ca3af", transition: "all 0.3s" },
  dotDone: { background: "#dbeafe", color: "#1d4ed8" },
  dotActive: { background: "#1d4ed8", color: "white", boxShadow: "0 2px 8px rgba(29,78,216,0.3)" },
  label: { fontSize: "0.58rem", fontWeight: 600, color: "#9ca3af", textAlign: "center", whiteSpace: "nowrap" },
  labelDone: { color: "#1d4ed8" },
  line: { position: "absolute", top: 11, left: 30, right: 30, height: 3, background: "#e5e7eb", borderRadius: 999, zIndex: 0 },
  lineFill: { height: "100%", background: "linear-gradient(90deg, #1d4ed8, #3b82f6)", borderRadius: 999, transition: "width 0.4s ease" },
  progressBtnGroup: { display: "flex", gap: 6, marginTop: 6 },
  nextBtn: { flex: 1, padding: "7px 12px", borderRadius: 7, background: "#eff6ff", color: "#1d4ed8", fontSize: "0.72rem", fontWeight: 600, border: "1px solid #dbeafe", cursor: "pointer" },
  prevBtn: { flex: 1, padding: "7px 12px", borderRadius: 7, background: "#f9fafb", color: "#475569", fontSize: "0.72rem", fontWeight: 600, border: "1px solid #d1d5db", cursor: "pointer" },
};

const priorityColors = { High: "#dc2626", Medium: "#d97706", Low: "#059669" };

function TaskCard({ task, onEdit, onDelete, onUpdateProgress, isAssignee, isAdmin }) {
  const currentProgress = task.progress || "Accepted";
  const currentStepIndex = PROGRESS_STEPS.indexOf(currentProgress);

  return (
    <div style={s.card}>
      <div style={s.header}>
        <div>
          <h4 style={s.title}>{task.title}</h4>
          {task.description && <p style={s.desc}>{task.description}</p>}
        </div>
        <span style={{ ...s.badge, background: priorityColors[task.priority] || "#6b7280" }}>{task.priority}</span>
      </div>

      {/* Progress Stepper */}
      <div style={s.stepper}>
        {PROGRESS_STEPS.map((step, index) => (
          <div key={step} style={s.step}>
            <div style={{ ...s.dot, ...(index <= currentStepIndex ? s.dotDone : {}), ...(index === currentStepIndex ? s.dotActive : {}) }}>
              {index < currentStepIndex ? "✓" : index + 1}
            </div>
            <span style={{ ...s.label, ...(index <= currentStepIndex ? s.labelDone : {}) }}>{step}</span>
          </div>
        ))}
        <div style={s.line}>
          <div style={{ ...s.lineFill, width: `${(currentStepIndex / (PROGRESS_STEPS.length - 1)) * 100}%` }} />
        </div>
      </div>

      {/* Progress buttons — only for assignee */}
      {isAssignee && onUpdateProgress && (
        <div style={s.progressBtnGroup}>
          {currentStepIndex > 0 && (
            <button style={s.prevBtn} onClick={(e) => { e.stopPropagation(); onUpdateProgress(task, PROGRESS_STEPS[currentStepIndex - 1]); }}>
              ← {PROGRESS_STEPS[currentStepIndex - 1]}
            </button>
          )}
          {currentStepIndex < PROGRESS_STEPS.length - 1 && (
            <button style={s.nextBtn} onClick={(e) => { e.stopPropagation(); onUpdateProgress(task, PROGRESS_STEPS[currentStepIndex + 1]); }}>
              {PROGRESS_STEPS[currentStepIndex + 1]} →
            </button>
          )}
        </div>
      )}

      <div style={s.meta}>
        <span>
          {task.assigneeEmpId?.includes(",")
            ? `👥 Team (${task.assigneeEmpId.split(",").length} members)`
            : task.assigneeEmpId || task.assignee || "Unassigned"}
        </span>
        <span>{task.dueDate || "No due date"}</span>
      </div>

      {isAdmin && (
        <div style={s.actions}>
          <button style={s.btnEdit} onClick={() => onEdit(task)}>Edit</button>
          <button style={s.btnDelete} onClick={() => onDelete(task)}>Delete</button>
        </div>
      )}
    </div>
  );
}

export default TaskCard;
