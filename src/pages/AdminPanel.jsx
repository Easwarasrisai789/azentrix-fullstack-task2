import React, { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useAuth } from "../context/AuthContext";
import AuthenticatedLayout from "../components/AuthenticatedLayout";

const s = {
  page: { display: "grid", gap: 26 },
  eyebrow: { textTransform: "uppercase", letterSpacing: "0.12em", fontSize: "0.7rem", fontWeight: 700, color: "#1d4ed8", margin: "0 0 4px" },
  title: { margin: "4px 0 6px", fontSize: "1.5rem", fontWeight: 800, color: "#0f172a" },
  sub: { margin: 0, color: "#64748b", fontSize: "0.88rem" },
  card: { background: "#fff", borderRadius: 14, padding: "28px 28px", border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
  formRow: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 24 },
  input: { flex: 1, minWidth: 220, padding: "11px 14px", borderRadius: 9, border: "1.5px solid #d1d5db", fontSize: "0.88rem", boxSizing: "border-box" },
  btn: { padding: "11px 18px", borderRadius: 9, background: "#1d4ed8", color: "white", border: "none", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", boxShadow: "0 2px 6px rgba(29,78,216,0.25)" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" },
  th: { textAlign: "left", color: "#475569", fontWeight: 600, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", padding: "14px 16px", borderBottom: "1px solid #e5e7eb", background: "#f9fafb" },
  td: { padding: "14px 16px", borderBottom: "1px solid #f3f4f6", color: "#334155" },
  roleBtn: { padding: "7px 14px", borderRadius: 8, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", border: "1px solid #d1d5db", background: "#f1f5f9", color: "#334155" },
  error: { color: "#dc2626", fontSize: "0.82rem" },
  success: { color: "#059669", fontSize: "0.82rem" },
  loading: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "55vh", gap: 14 },
  spinner: { width: 36, height: 36, border: "3px solid #e5e7eb", borderTopColor: "#1d4ed8", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  requestCard: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 16px", borderRadius: 10, background: "#fffbeb", border: "1px solid #fde68a", marginBottom: 8 },
  requestInfo: { display: "flex", flexDirection: "column", gap: 2 },
  requestName: { fontSize: "0.88rem", fontWeight: 600, color: "#0f172a" },
  requestMeta: { fontSize: "0.75rem", color: "#92400e" },
  requestActions: { display: "flex", gap: 6 },
  approveBtn: { padding: "6px 14px", borderRadius: 7, fontSize: "0.75rem", fontWeight: 600, background: "#059669", color: "white", border: "none", cursor: "pointer" },
  rejectBtn: { padding: "6px 14px", borderRadius: 7, fontSize: "0.75rem", fontWeight: 600, background: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca", cursor: "pointer" },
};

function AdminPanel() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [adminRequests, setAdminRequests] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!db) { setError("Firebase not configured."); setPageLoading(false); return; }
    const unsub1 = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.email || "").localeCompare(b.email || "")));
      setPageLoading(false);
    }, (err) => { setError(err.message); setPageLoading(false); });

    // Listen to admin requests
    const unsub2 = onSnapshot(collection(db, "adminRequests"), (snap) => {
      setAdminRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((r) => r.status === "pending"));
    });

    return () => { unsub1(); unsub2(); };
  }, []);

  const toggleRole = async (userId, currentRole) => {
    if (!db) return;
    if (userId === currentUser?.uid && currentRole === "admin") { setError("Cannot revoke own admin."); return; }
    setLoading(true); setMessage(null); setError(null);
    try { await updateDoc(doc(db, "users", userId), { role: currentRole === "admin" ? "member" : "admin" }); setMessage("Role updated."); }
    catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const addAdminByEmail = async (e) => {
    e.preventDefault(); setMessage(null); setError(null);
    const email = newAdminEmail.trim().toLowerCase();
    if (!email) { setError("Enter an email."); return; }
    if (!db) return; setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "users"), where("email", "==", email)));
      if (snap.empty) { setError("No user found."); setLoading(false); return; }
      await updateDoc(doc(db, "users", snap.docs[0].id), { role: "admin" });
      setMessage(`${email} is now admin.`); setNewAdminEmail("");
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const approveRequest = async (request) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, "users", request.uid), { role: "admin" });
      await updateDoc(doc(db, "adminRequests", request.id), { status: "approved" });
      setMessage(`${request.email} approved as admin.`);
    } catch (err) { setError(err.message); }
  };

  const rejectRequest = async (request) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "adminRequests", request.id));
      setMessage("Request rejected.");
    } catch (err) { setError(err.message); }
  };

  if (pageLoading) return <AuthenticatedLayout><div style={s.loading}><div style={s.spinner} /><span style={{ color: "#64748b" }}>Loading...</span></div></AuthenticatedLayout>;

  return (
    <AuthenticatedLayout>
      <div style={s.page}>
        <div>
          <p style={s.eyebrow}>Administration</p>
          <h1 style={s.title}>Admin Panel</h1>
          <p style={s.sub}>Manage users, permissions, and admin requests.</p>
        </div>

        {/* Admin Requests */}
        {adminRequests.length > 0 && (
          <div style={s.card}>
            <h3 style={{ margin: "0 0 14px", fontSize: "1.05rem", fontWeight: 700, color: "#92400e" }}>
              🔔 Admin Requests ({adminRequests.length})
            </h3>
            {adminRequests.map((req) => (
              <div key={req.id} style={s.requestCard}>
                <div style={s.requestInfo}>
                  <span style={s.requestName}>{req.fullName || req.email}</span>
                  <span style={s.requestMeta}>{req.email} · {req.empId || "No ID"}</span>
                </div>
                <div style={s.requestActions}>
                  <button style={s.approveBtn} onClick={() => approveRequest(req)}>Approve</button>
                  <button style={s.rejectBtn} onClick={() => rejectRequest(req)}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Main Card */}
        <div style={s.card}>
          {error && <p style={s.error}>{error}</p>}
          {message && <p style={s.success}>{message}</p>}

          <form onSubmit={addAdminByEmail}>
            <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#334155", display: "block", marginBottom: 8 }}>Promote user to admin</label>
            <div style={s.formRow}>
              <input style={s.input} type="email" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} placeholder="user@example.com" />
              <button style={s.btn} type="submit" disabled={loading}>{loading ? "..." : "Grant Admin"}</button>
            </div>
          </form>

          <table style={s.table}>
            <thead>
              <tr><th style={s.th}>Name</th><th style={s.th}>Email</th><th style={s.th}>Role</th><th style={s.th}>Action</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={s.td}>{u.fullName || "—"}</td>
                  <td style={s.td}>{u.email}</td>
                  <td style={s.td}><span style={{ fontWeight: 600, color: u.role === "admin" ? "#1d4ed8" : "#64748b" }}>{u.role}</span></td>
                  <td style={s.td}>
                    <button style={s.roleBtn} onClick={() => toggleRole(u.id, u.role)} disabled={loading || (u.id === currentUser?.uid && u.role === "admin")}>
                      {u.role === "admin" ? "Revoke" : "Make Admin"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

export default AdminPanel;
