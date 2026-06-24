import React, { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useAuth } from "../context/AuthContext";
import AuthenticatedLayout from "../components/AuthenticatedLayout";

const s = {
  page: { display: "grid", gap: 24 },
  eyebrow: { textTransform: "uppercase", letterSpacing: "0.14em", fontSize: "0.72rem", fontWeight: 800, color: "#4f46e5", margin: "0 0 6px" },
  title: { margin: "0 0 6px", fontSize: "1.8rem", fontWeight: 800, color: "#0f172a" },
  sub: { margin: 0, color: "#64748b", fontSize: "0.95rem" },
  tabs: { display: "flex", gap: 8 },
  tab: { padding: "9px 18px", borderRadius: 10, border: "1px solid #d1d5db", background: "#fff", color: "#475569", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" },
  tabActive: { background: "#4f46e5", color: "#fff", border: "1px solid #4f46e5" },
  grid: { display: "grid", gap: 14 },
  card: { padding: "20px 22px", borderRadius: 14, background: "#fff", border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", display: "flex", gap: 14, alignItems: "flex-start" },
  icon: { width: 38, height: 38, borderRadius: 10, display: "grid", placeItems: "center", fontSize: "1rem", flexShrink: 0 },
  content: { flex: 1, minWidth: 0 },
  subject: { fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "0 0 3px" },
  meta: { fontSize: "0.72rem", color: "#64748b", marginBottom: 8 },
  message: { fontSize: "0.88rem", color: "#334155", lineHeight: 1.6, margin: "0 0 12px" },
  replyBox: { display: "flex", gap: 8, alignItems: "center" },
  replyInput: { flex: 1, padding: "9px 14px", borderRadius: 9, border: "1.5px solid #d1d5db", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" },
  replyBtn: { padding: "9px 16px", borderRadius: 9, background: "#4f46e5", color: "#fff", border: "none", fontWeight: 600, fontSize: "0.78rem", cursor: "pointer" },
  statusBadge: { padding: "3px 9px", borderRadius: 999, fontSize: "0.68rem", fontWeight: 700 },
  adminReply: { marginTop: 10, padding: "10px 14px", borderRadius: 10, background: "#eff6ff", border: "1px solid #dbeafe", fontSize: "0.82rem", color: "#1e40af" },
  actions: { display: "flex", gap: 6, marginTop: 10 },
  btnResolve: { padding: "6px 14px", borderRadius: 7, fontSize: "0.72rem", fontWeight: 600, background: "#d1fae5", color: "#065f46", border: "1px solid #a7f3d0", cursor: "pointer" },
  btnDismiss: { padding: "6px 14px", borderRadius: 7, fontSize: "0.72rem", fontWeight: 600, background: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca", cursor: "pointer" },
  empty: { textAlign: "center", padding: "40px 20px", color: "#94a3b8" },
  loading: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "55vh", gap: 14 },
  spinner: { width: 36, height: 36, border: "3px solid #e5e7eb", borderTopColor: "#4f46e5", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
};

const iconColors = { "Bug Report": "#fee2e2", "Feature Request": "#dbeafe", "Security Issue": "#fef3c7", "General Feedback": "#f1f5f9" };
const icons = { "Bug Report": "🐛", "Feature Request": "💡", "Security Issue": "🔒", "General Feedback": "💬" };
const statusColors = { open: { bg: "#fef3c7", color: "#92400e" }, "working on it": { bg: "#dbeafe", color: "#1e40af" }, resolved: { bg: "#d1fae5", color: "#065f46" } };

function FeedbackAdmin() {
  const { currentUser } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [replyText, setReplyText] = useState({});
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!db) { setPageLoading(false); return; }
    const unsub = onSnapshot(collection(db, "feedback"), (snap) => {
      setFeedbacks(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => {
        const aT = a.createdAt?.toDate?.() || new Date(0);
        const bT = b.createdAt?.toDate?.() || new Date(0);
        return bT - aT;
      }));
      setPageLoading(false);
    });
    return () => unsub();
  }, []);

  const handleReply = async (fb) => {
    const text = replyText[fb.id]?.trim();
    if (!text || !db) return;
    await updateDoc(doc(db, "feedback", fb.id), { adminReply: text, status: "working on it", repliedBy: currentUser?.email, repliedAt: new Date() });
    setReplyText((p) => ({ ...p, [fb.id]: "" }));
  };

  const markResolved = async (fb) => {
    if (!db) return;
    await updateDoc(doc(db, "feedback", fb.id), { status: "resolved" });
  };

  const dismissFeedback = async (fb) => {
    if (!db) return;
    await deleteDoc(doc(db, "feedback", fb.id));
  };

  const filtered = filter === "all" ? feedbacks : feedbacks.filter((f) => f.status === filter);

  if (pageLoading) return <AuthenticatedLayout><div style={s.loading}><div style={s.spinner} /><span style={{ color: "#64748b" }}>Loading...</span></div></AuthenticatedLayout>;

  return (
    <AuthenticatedLayout>
      <div style={s.page}>
        <div>
          <p style={s.eyebrow}>Support Center</p>
          <h1 style={s.title}>Feedback & Issues</h1>
          <p style={s.sub}>Review member feedback, reply, and mark issues as resolved.</p>
        </div>

        <div style={s.tabs}>
          {["all", "open", "working on it", "resolved"].map((t) => (
            <button key={t} style={{ ...s.tab, ...(filter === t ? s.tabActive : {}) }} onClick={() => setFilter(t)}>
              {t === "all" ? `All (${feedbacks.length})` : `${t.charAt(0).toUpperCase() + t.slice(1)} (${feedbacks.filter((f) => f.status === t).length})`}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={s.empty}><p style={{ fontSize: "1rem" }}>No feedback in this category.</p></div>
        ) : (
          <div style={s.grid}>
            {filtered.map((fb) => {
              const sc = statusColors[fb.status] || statusColors.open;
              return (
                <div key={fb.id} style={s.card}>
                  <div style={{ ...s.icon, background: iconColors[fb.type] || "#f1f5f9" }}>{icons[fb.type] || "💬"}</div>
                  <div style={s.content}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                      <h4 style={s.subject}>{fb.subject}</h4>
                      <span style={{ ...s.statusBadge, background: sc.bg, color: sc.color }}>{fb.status || "open"}</span>
                    </div>
                    <p style={s.meta}>{fb.fullName || fb.email} · {fb.type} · {fb.createdAt?.toDate ? fb.createdAt.toDate().toLocaleDateString() : "—"}</p>
                    <p style={s.message}>{fb.message}</p>

                    {fb.adminReply && (
                      <div style={s.adminReply}>
                        <strong style={{ fontSize: "0.72rem" }}>Admin reply:</strong> {fb.adminReply}
                      </div>
                    )}

                    {fb.status !== "resolved" && (
                      <div style={s.replyBox}>
                        <input style={s.replyInput} placeholder="Reply to member..." value={replyText[fb.id] || ""} onChange={(e) => setReplyText((p) => ({ ...p, [fb.id]: e.target.value }))} />
                        <button style={s.replyBtn} onClick={() => handleReply(fb)}>Reply</button>
                      </div>
                    )}

                    <div style={s.actions}>
                      {fb.status !== "resolved" && <button style={s.btnResolve} onClick={() => markResolved(fb)}>✓ Mark Resolved</button>}
                      <button style={s.btnDismiss} onClick={() => dismissFeedback(fb)}>Dismiss</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

export default FeedbackAdmin;
