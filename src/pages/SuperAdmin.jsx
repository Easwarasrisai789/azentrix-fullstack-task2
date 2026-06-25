import React, { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useAuth } from "../context/AuthContext";
import AuthenticatedLayout from "../components/AuthenticatedLayout";

const SUPER_ADMIN_EMAIL = "easwarasrisaivenkat.a@gmail.com";

const s = {
  page: { display: "grid", gap: 24, maxWidth: 800, margin: "0 auto" },
  eyebrow: { textTransform: "uppercase", letterSpacing: "0.14em", fontSize: "0.72rem", fontWeight: 800, color: "#ec4899", margin: "0 0 6px" },
  title: { margin: "0 0 6px", fontSize: "1.8rem", fontWeight: 800, color: "#0f172a" },
  sub: { margin: 0, color: "#64748b", fontSize: "0.95rem" },
  card: { background: "#fff", borderRadius: 16, padding: 28, border: "1px solid #e5e7eb", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" },
  sectionTitle: { margin: "0 0 14px", fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" },
  form: { display: "flex", gap: 10, alignItems: "center", marginBottom: 20 },
  input: { flex: 1, padding: "12px 16px", borderRadius: 10, border: "1.5px solid #d1d5db", fontSize: "0.9rem", boxSizing: "border-box" },
  btn: { padding: "12px 20px", borderRadius: 10, background: "linear-gradient(135deg, #ec4899, #f472b6)", color: "white", border: "none", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", boxShadow: "0 4px 12px rgba(236,72,153,0.25)", whiteSpace: "nowrap" },
  list: { display: "grid", gap: 8 },
  item: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 16px", borderRadius: 12, background: "#fdf2f8", border: "1px solid #fce7f3" },
  itemName: { fontSize: "0.9rem", fontWeight: 600, color: "#0f172a" },
  itemEmail: { fontSize: "0.75rem", color: "#9d174d" },
  removeBtn: { padding: "6px 14px", borderRadius: 8, fontSize: "0.72rem", fontWeight: 600, background: "#fff", color: "#dc2626", border: "1px solid #fecaca", cursor: "pointer" },
  error: { color: "#dc2626", fontSize: "0.85rem", fontWeight: 600 },
  success: { color: "#059669", fontSize: "0.85rem", fontWeight: 600 },
  warning: { padding: "14px 18px", borderRadius: 12, background: "#fef3c7", border: "1px solid #fde68a", fontSize: "0.85rem", color: "#92400e", lineHeight: 1.6 },
  loading: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "55vh", gap: 14 },
  spinner: { width: 36, height: 36, border: "3px solid #e5e7eb", borderTopColor: "#ec4899", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
};

function SuperAdmin() {
  const { currentUser } = useAuth();
  const [superAdmins, setSuperAdmins] = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Only allow the original super admin to access
  const isOriginalSuper = currentUser?.email === SUPER_ADMIN_EMAIL;

  useEffect(() => {
    if (!db) { setPageLoading(false); return; }
    const unsub = onSnapshot(collection(db, "superAdmins"), (snap) => {
      setSuperAdmins(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setPageLoading(false);
    });
    return () => unsub();
  }, []);

  const addSuperAdmin = async (e) => {
    e.preventDefault();
    setError(null); setMessage(null);
    const email = newEmail.trim().toLowerCase();
    if (!email) { setError("Enter an email."); return; }
    if (!db) return;
    setLoading(true);
    try {
      // Find user
      const userSnap = await getDocs(query(collection(db, "users"), where("email", "==", email)));
      if (userSnap.empty) { setError("No registered user found with this email."); setLoading(false); return; }
      // Make them admin first
      await updateDoc(doc(db, "users", userSnap.docs[0].id), { role: "admin" });
      // Add to superAdmins collection
      const { setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "superAdmins", userSnap.docs[0].id), { email, addedBy: currentUser.email, addedAt: new Date() });
      setMessage(`${email} is now a Super Admin.`);
      setNewEmail("");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const removeSuperAdmin = async (sa) => {
    if (sa.email === SUPER_ADMIN_EMAIL) { setError("Cannot remove the original Super Admin."); return; }
    if (!window.confirm(`Remove ${sa.email} from Super Admin?`)) return;
    if (!db) return;
    try {
      const { deleteDoc: delDoc } = await import("firebase/firestore");
      await delDoc(doc(db, "superAdmins", sa.id));
      setMessage(`${sa.email} removed from Super Admin.`);
    } catch (err) { setError(err.message); }
  };

  if (!isOriginalSuper) {
    return (
      <AuthenticatedLayout>
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
          <h2 style={{ color: "#0f172a" }}>Access Denied</h2>
          <p>Only the original Super Admin can access this page.</p>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (pageLoading) return <AuthenticatedLayout><div style={s.loading}><div style={s.spinner} /><span style={{ color: "#64748b" }}>Loading...</span></div></AuthenticatedLayout>;

  return (
    <AuthenticatedLayout>
      <div style={s.page}>
        <div>
          <p style={s.eyebrow}>🔐 Super Admin Control</p>
          <h1 style={s.title}>Manage Super Admins</h1>
          <p style={s.sub}>Add or remove Super Admins. Only Super Admins can revoke admin access and delete accounts.</p>
        </div>

        <div style={s.warning}>
          <strong>⚠️ Important:</strong> Super Admins have full control — they can revoke any admin, delete any user, and manage the entire workspace. Only grant this to trusted people.
        </div>

        <div style={s.card}>
          <h3 style={s.sectionTitle}>Add New Super Admin</h3>
          {error && <p style={s.error}>{error}</p>}
          {message && <p style={s.success}>{message}</p>}
          <form onSubmit={addSuperAdmin} style={s.form}>
            <input style={s.input} type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="user@example.com" />
            <button style={{ ...s.btn, opacity: loading ? 0.6 : 1 }} type="submit" disabled={loading}>
              {loading ? "..." : "Add Super Admin"}
            </button>
          </form>

          <h3 style={s.sectionTitle}>Current Super Admins</h3>
          <div style={s.list}>
            {/* Always show the original */}
            <div style={s.item}>
              <div>
                <span style={s.itemName}>Original Super Admin</span>
                <span style={{ ...s.itemEmail, display: "block" }}>{SUPER_ADMIN_EMAIL}</span>
              </div>
              <span style={{ fontSize: "0.7rem", color: "#92400e", fontWeight: 700, background: "#fef3c7", padding: "3px 8px", borderRadius: 999 }}>PERMANENT</span>
            </div>
            {superAdmins.filter((sa) => sa.email !== SUPER_ADMIN_EMAIL).map((sa) => (
              <div key={sa.id} style={s.item}>
                <div>
                  <span style={s.itemName}>{sa.email}</span>
                  <span style={{ ...s.itemEmail, display: "block" }}>Added by {sa.addedBy}</span>
                </div>
                <button style={s.removeBtn} onClick={() => removeSuperAdmin(sa)}>Remove</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

export default SuperAdmin;
