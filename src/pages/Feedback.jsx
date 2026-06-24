import React, { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useAuth } from "../context/AuthContext";
import AuthenticatedLayout from "../components/AuthenticatedLayout";

const s = {
  page: {
    display: "grid",
    gap: 28,
    maxWidth: 720,
    margin: "0 auto",
  },
  eyebrow: {
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    fontSize: "0.72rem",
    fontWeight: 800,
    color: "#4f46e5",
    margin: "0 0 6px",
  },
  title: {
    margin: "0 0 6px",
    fontSize: "1.8rem",
    fontWeight: 800,
    color: "#0f172a",
  },
  sub: {
    margin: 0,
    color: "#64748b",
    fontSize: "0.95rem",
    lineHeight: 1.6,
  },
  card: {
    background: "#ffffff",
    borderRadius: 20,
    padding: 32,
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 20px rgba(15,23,42,0.06)",
  },
  form: {
    display: "grid",
    gap: 18,
  },
  fieldGroup: {
    display: "grid",
    gap: 6,
  },
  label: {
    fontSize: "0.82rem",
    fontWeight: 700,
    color: "#334155",
  },
  input: {
    width: "100%",
    padding: "13px 16px",
    borderRadius: 12,
    border: "1.5px solid #d1d5db",
    background: "#fff",
    fontSize: "0.92rem",
    boxSizing: "border-box",
    outline: "none",
  },
  textarea: {
    width: "100%",
    padding: "13px 16px",
    borderRadius: 12,
    border: "1.5px solid #d1d5db",
    background: "#fff",
    fontSize: "0.92rem",
    boxSizing: "border-box",
    outline: "none",
    resize: "vertical",
    minHeight: 120,
  },
  select: {
    width: "100%",
    padding: "13px 16px",
    borderRadius: 12,
    border: "1.5px solid #d1d5db",
    background: "#fff",
    fontSize: "0.92rem",
    boxSizing: "border-box",
    outline: "none",
  },
  btnRow: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },
  btnPrimary: {
    padding: "13px 28px",
    borderRadius: 12,
    background: "linear-gradient(135deg,#4f46e5,#6366f1)",
    color: "white",
    border: "none",
    fontWeight: 700,
    fontSize: "0.92rem",
    cursor: "pointer",
    boxShadow: "0 6px 20px rgba(79,70,229,0.25)",
  },
  btnSecondary: {
    padding: "13px 28px",
    borderRadius: 12,
    background: "#f1f5f9",
    color: "#334155",
    border: "1px solid #d1d5db",
    fontWeight: 700,
    fontSize: "0.92rem",
    cursor: "pointer",
    textDecoration: "none",
  },
  success: {
    padding: "18px 24px",
    borderRadius: 14,
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    color: "#065f46",
    fontSize: "0.9rem",
    fontWeight: 600,
    textAlign: "center",
  },
  error: {
    color: "#dc2626",
    fontSize: "0.85rem",
    fontWeight: 600,
  },
  infoCards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 14,
  },
  infoCard: {
    padding: "20px",
    borderRadius: 14,
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    textAlign: "center",
  },
  infoIcon: {
    fontSize: "1.6rem",
    marginBottom: 8,
  },
  infoTitle: {
    margin: "0 0 4px",
    fontSize: "0.88rem",
    fontWeight: 700,
    color: "#0f172a",
  },
  infoText: {
    margin: 0,
    fontSize: "0.78rem",
    color: "#64748b",
  },
};

const TYPES = ["Bug Report", "Feature Request", "General Feedback", "Security Issue"];

function Feedback() {
  const { currentUser, userData } = useAuth();
  const [type, setType] = useState("General Feedback");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [myFeedbacks, setMyFeedbacks] = useState([]);

  // Load user's own feedback submissions
  useEffect(() => {
    if (!db || !currentUser) return;
    const q = query(collection(db, "feedback"), where("uid", "==", currentUser.uid));
    const unsub = onSnapshot(q, (snap) => {
      setMyFeedbacks(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => {
        const aT = a.createdAt?.toDate?.() || new Date(0);
        const bT = b.createdAt?.toDate?.() || new Date(0);
        return bT - aT;
      }));
    });
    return () => unsub();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    if (!subject.trim() || !message.trim()) {
      setStatus({ type: "error", msg: "Subject and message are required." });
      return;
    }
    if (!db || !currentUser) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "feedback"), {
        type,
        subject: subject.trim(),
        message: message.trim(),
        uid: currentUser.uid,
        email: currentUser.email,
        fullName: userData?.fullName || "",
        status: "open",
        createdAt: serverTimestamp(),
      });
      setStatus({ type: "success", msg: "Thank you! Your feedback has been submitted." });
      setSubject("");
      setMessage("");
      setType("General Feedback");
    } catch (err) {
      setStatus({ type: "error", msg: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const emailSubject = encodeURIComponent(`[CollabBoard] Feedback from ${userData?.fullName || currentUser?.email || "User"}`);
  const emailBody = encodeURIComponent(`Hi CollabBoard Team,\n\nI'd like to report the following:\n\nType: \nDescription: \n\n---\nSent from: ${currentUser?.email || ""}`);
  const mailtoLink = `mailto:support@collabboard.com?subject=${emailSubject}&body=${emailBody}`;

  return (
    <AuthenticatedLayout>
      <div style={s.page}>
        <div>
          <p style={s.eyebrow}>Support</p>
          <h1 style={s.title}>Feedback & Report</h1>
          <p style={s.sub}>Help us improve CollabBoard. Report bugs, request features, or share your thoughts.</p>
        </div>

        {/* Quick info cards */}
        <div style={s.infoCards}>
          <div style={s.infoCard}>
            <div style={s.infoIcon}>🐛</div>
            <h4 style={s.infoTitle}>Bug Report</h4>
            <p style={s.infoText}>Something broken? Let us know.</p>
          </div>
          <div style={s.infoCard}>
            <div style={s.infoIcon}>💡</div>
            <h4 style={s.infoTitle}>Feature Request</h4>
            <p style={s.infoText}>Got an idea? We'd love to hear it.</p>
          </div>
          <div style={s.infoCard}>
            <div style={s.infoIcon}>📧</div>
            <h4 style={s.infoTitle}>Email Us</h4>
            <p style={s.infoText}>Prefer email? Use the link below.</p>
          </div>
        </div>

        {/* Feedback form */}
        <div style={s.card}>
          {status?.type === "success" ? (
            <div style={s.success}>✓ {status.msg}</div>
          ) : (
            <form onSubmit={handleSubmit} style={s.form}>
              <div style={s.fieldGroup}>
                <label style={s.label}>Type</label>
                <select style={s.select} value={type} onChange={(e) => setType(e.target.value)}>
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div style={s.fieldGroup}>
                <label style={s.label}>Subject</label>
                <input style={s.input} placeholder="Brief summary of your feedback" value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>

              <div style={s.fieldGroup}>
                <label style={s.label}>Message</label>
                <textarea style={s.textarea} placeholder="Describe in detail..." value={message} onChange={(e) => setMessage(e.target.value)} rows={5} />
              </div>

              {status?.type === "error" && <p style={s.error}>{status.msg}</p>}

              <div style={s.btnRow}>
                <button type="submit" style={{ ...s.btnPrimary, opacity: submitting ? 0.6 : 1 }} disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Feedback"}
                </button>
                <a href={mailtoLink} style={s.btnSecondary}>
                  📧 Email Instead
                </a>
              </div>
            </form>
          )}
        </div>

        {/* My Submissions */}
        {myFeedbacks.length > 0 && (
          <div style={{ ...s.card, maxWidth: "100%" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
              My Submissions ({myFeedbacks.length})
            </h3>
            <div style={{ display: "grid", gap: 10 }}>
              {myFeedbacks.map((fb) => {
                const statusColor = fb.status === "resolved" ? { bg: "#d1fae5", color: "#065f46" } : fb.status === "working on it" ? { bg: "#dbeafe", color: "#1e40af" } : { bg: "#fef3c7", color: "#92400e" };
                return (
                  <div key={fb.id} style={{ padding: "14px 16px", borderRadius: 12, background: "#f9fafb", border: "1px solid #e5e7eb" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <strong style={{ fontSize: "0.88rem", color: "#0f172a" }}>{fb.subject}</strong>
                      <span style={{ padding: "3px 9px", borderRadius: 999, fontSize: "0.65rem", fontWeight: 700, background: statusColor.bg, color: statusColor.color }}>
                        {fb.status || "open"}
                      </span>
                    </div>
                    <p style={{ margin: "0 0 6px", fontSize: "0.82rem", color: "#64748b" }}>{fb.type} · {fb.createdAt?.toDate ? fb.createdAt.toDate().toLocaleDateString() : "—"}</p>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#334155", lineHeight: 1.5 }}>{fb.message}</p>
                    {fb.adminReply && (
                      <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: "#eff6ff", border: "1px solid #dbeafe" }}>
                        <strong style={{ fontSize: "0.72rem", color: "#1e40af" }}>Admin reply:</strong>
                        <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "#1e40af" }}>{fb.adminReply}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

export default Feedback;
