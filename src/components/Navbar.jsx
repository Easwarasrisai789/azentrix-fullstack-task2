import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useAuth } from "../context/AuthContext";

const s = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 32px",
    background: "rgba(10,15,26,0.97)",
    backdropFilter: "blur(12px)",
    color: "#fff",
    position: "sticky",
    top: 0,
    zIndex: 100,
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  brand: { fontSize: "1.2rem", fontWeight: 800, color: "white", textDecoration: "none" },
  navLink: { color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: "0.85rem", fontWeight: 500 },
  btnPrimary: {
    padding: "8px 18px",
    fontSize: "0.82rem",
    borderRadius: 9,
    background: "#1d4ed8",
    color: "white",
    border: "none",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(29,78,216,0.3)",
  },
  btnGhost: {
    padding: "8px 14px",
    fontSize: "0.82rem",
    borderRadius: 9,
    background: "rgba(255,255,255,0.08)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.15)",
    fontWeight: 600,
    cursor: "pointer",
  },
  email: { fontSize: "0.85rem", color: "#cbd5e1" },
  bellWrap: {
    position: "relative",
    cursor: "pointer",
    padding: "6px 8px",
    borderRadius: 8,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  bellIcon: { fontSize: "1rem" },
  bellBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: "#ef4444",
    color: "white",
    fontSize: "0.6rem",
    fontWeight: 700,
    display: "grid",
    placeItems: "center",
    border: "2px solid #0a0f1a",
  },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    width: 320,
    background: "#ffffff",
    borderRadius: 12,
    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
    border: "1px solid #e5e7eb",
    zIndex: 200,
    overflow: "hidden",
  },
  dropdownHeader: {
    padding: "14px 16px",
    borderBottom: "1px solid #f3f4f6",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownTitle: { margin: 0, fontSize: "0.88rem", fontWeight: 700, color: "#0f172a" },
  dropdownList: { maxHeight: 260, overflowY: "auto" },
  dropdownItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: "12px 16px",
    borderBottom: "1px solid #f9fafb",
  },
  dropdownName: { fontSize: "0.82rem", fontWeight: 600, color: "#0f172a" },
  dropdownMeta: { fontSize: "0.7rem", color: "#64748b" },
  dropdownEmpty: { padding: "20px 16px", textAlign: "center", color: "#94a3b8", fontSize: "0.82rem" },
};

function Navbar({ variant = "default" }) {
  const { currentUser, role, signOutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isPublicPage = variant === "public" || ["/", "/login", "/register"].includes(location.pathname);

  const [requests, setRequests] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);

  // Listen to admin requests (only if admin)
  useEffect(() => {
    if (!db || role !== "admin") return;
    const unsub = onSnapshot(collection(db, "adminRequests"), (snap) => {
      setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((r) => r.status === "pending"));
    });
    return () => unsub();
  }, [role]);

  const handleApprove = async (req) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, "users", req.uid), { role: "admin" });
      await updateDoc(doc(db, "adminRequests", req.id), { status: "approved" });
      setActionMsg(`${req.fullName || req.email} is now admin`);
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err) { console.error(err); }
  };

  const handleReject = async (req) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "adminRequests", req.id));
      setActionMsg("Request rejected");
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err) { console.error(err); }
  };

  return (
    <nav style={s.nav}>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <Link style={s.brand} to="/">CollabBoard</Link>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Link to="/" style={s.navLink}>Home</Link>
          {!isPublicPage && currentUser && (
            <>
              <Link to="/dashboard" style={s.navLink}>Dashboard</Link>
              <Link to="/teams" style={s.navLink}>{role === "admin" ? "Teams" : "My Team"}</Link>
              <Link to="/chat" style={s.navLink}>Chat</Link>
              {role === "admin" && (
                <Link to="/admin" style={{ ...s.navLink, color: "#fbbf24", background: "rgba(251,191,36,0.12)", padding: "5px 10px", borderRadius: 7 }}>Admin</Link>
              )}
              {currentUser?.email === "easwarasrisaivenkat.a@gmail.com" && (
                <Link to="/super-admin" style={{ ...s.navLink, color: "#f472b6", background: "rgba(244,114,182,0.12)", padding: "5px 10px", borderRadius: 7 }}>Super Admin</Link>
              )}
            </>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Notification Bell — admin only */}
        {role === "admin" && !isPublicPage && (
          <div style={{ position: "relative" }}>
            <div style={s.bellWrap} onClick={() => setShowNotif(!showNotif)}>
              <span style={s.bellIcon}>🔔</span>
              {requests.length > 0 && <span style={s.bellBadge}>{requests.length}</span>}
            </div>

            {showNotif && (
              <div style={s.dropdown}>
                <div style={s.dropdownHeader}>
                  <h4 style={s.dropdownTitle}>Admin Requests</h4>
                  <span style={{ fontSize: "0.7rem", color: "#64748b" }}>{requests.length} pending</span>
                </div>
                {actionMsg && (
                  <div style={{ padding: "8px 16px", background: "#ecfdf5", color: "#059669", fontSize: "0.75rem", fontWeight: 600 }}>{actionMsg}</div>
                )}
                <div style={s.dropdownList}>
                  {requests.length === 0 ? (
                    <div style={s.dropdownEmpty}>No pending requests 🎉</div>
                  ) : (
                    requests.map((req) => (
                      <div key={req.id} style={s.dropdownItem}>
                        <div style={{ flex: 1 }}>
                          <span style={s.dropdownName}>{req.fullName || "Unknown"}</span>
                          <span style={{ ...s.dropdownMeta, display: "block" }}>{req.email} · {req.empId || "No ID"}</span>
                        </div>
                        <div style={{ display: "flex", gap: 5 }}>
                          <button
                            style={{ padding: "5px 10px", borderRadius: 6, fontSize: "0.7rem", fontWeight: 600, background: "#059669", color: "white", border: "none", cursor: "pointer" }}
                            onClick={() => handleApprove(req)}
                          >
                            ✓ Approve
                          </button>
                          <button
                            style={{ padding: "5px 10px", borderRadius: 6, fontSize: "0.7rem", fontWeight: 600, background: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca", cursor: "pointer" }}
                            onClick={() => handleReject(req)}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {currentUser ? (
          <>
            {isPublicPage ? (
              <button style={s.btnPrimary} onClick={() => navigate(role === "admin" ? "/admin" : "/dashboard")}>Go to Workspace</button>
            ) : (
              <span style={s.email}>{currentUser.email}</span>
            )}
            <button style={s.btnGhost} onClick={signOutUser}>Sign Out</button>
          </>
        ) : (
          <>
            <Link to="/login" style={s.navLink}>Login</Link>
            <button style={s.btnPrimary} onClick={() => navigate("/register")}>Sign Up</button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
