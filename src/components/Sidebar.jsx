import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useAuth } from "../context/AuthContext";

const s = {
  aside: {
    width: 260,
    padding: "28px 18px",
    background: "#0a0f1a",
    color: "#f8fafc",
    display: "flex",
    flexDirection: "column",
    gap: 22,
    position: "sticky",
    top: 0,
    alignSelf: "flex-start",
    minHeight: "100vh",
    height: "100vh",
    overflowY: "auto",
  },
  brand: {
    fontSize: "1.3rem",
    fontWeight: 800,
    letterSpacing: "-0.03em",
    background: "linear-gradient(135deg, #60a5fa, #a78bfa)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  role: {
    color: "#64748b",
    fontSize: "0.72rem",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontWeight: 600,
    marginTop: 2,
  },
  userBox: {
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "12px 14px",
    borderRadius: 10,
    background: "rgba(255,255,255,0.03)",
  },
  userName: { display: "block", marginBottom: 2, fontSize: "0.88rem", fontWeight: 600 },
  userRole: { color: "#64748b", fontSize: "0.78rem" },
  nav: { display: "flex", flexDirection: "column", gap: 4, flex: 1 },
  link: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    borderRadius: 9,
    color: "#94a3b8",
    textDecoration: "none",
    fontWeight: 500,
    fontSize: "0.88rem",
    transition: "background 0.15s",
  },
  linkActive: {
    background: "rgba(59,130,246,0.15)",
    color: "#60a5fa",
    fontWeight: 600,
  },
  footer: {
    paddingTop: 14,
    borderTop: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  logoutBtn: {
    width: "100%",
    padding: "10px 16px",
    borderRadius: 9,
    background: "#1e293b",
    color: "#cbd5e1",
    border: "1px solid rgba(255,255,255,0.08)",
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  requestBtn: {
    width: "100%",
    padding: "10px 16px",
    borderRadius: 9,
    background: "rgba(251,191,36,0.1)",
    color: "#fbbf24",
    border: "1px solid rgba(251,191,36,0.2)",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  requestSent: {
    width: "100%",
    padding: "10px 16px",
    borderRadius: 9,
    background: "rgba(16,185,129,0.1)",
    color: "#34d399",
    border: "1px solid rgba(16,185,129,0.2)",
    fontSize: "0.78rem",
    fontWeight: 600,
    textAlign: "center",
  },
};

function Sidebar() {
  const { currentUser, userData, role, signOutUser } = useAuth();
  const displayName = userData?.fullName || userData?.email?.split("@")[0] || "Member";
  const [requestStatus, setRequestStatus] = useState(null);

  const linkStyle = ({ isActive }) => ({
    ...s.link,
    ...(isActive ? s.linkActive : {}),
  });

  const handleRequestAdmin = async () => {
    if (!db || !currentUser) return;
    setRequestStatus("sending");
    try {
      await addDoc(collection(db, "adminRequests"), {
        uid: currentUser.uid,
        email: currentUser.email,
        fullName: userData?.fullName || "",
        empId: userData?.empId || "",
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setRequestStatus("sent");
    } catch (err) {
      setRequestStatus("error");
    }
  };

  return (
    <aside style={s.aside}>
      <div>
        <span style={s.brand}>CollabBoard</span>
        <p style={s.role}>{role === "admin" ? "Admin Portal" : "Team Member"}</p>
      </div>

      <div style={s.userBox}>
        <strong style={s.userName}>{displayName}</strong>
        <span style={s.userRole}>{role === "admin" ? "Administrator" : "Member"}</span>
      </div>

      <nav style={s.nav}>
        <NavLink to="/dashboard" style={linkStyle}>📊 Dashboard</NavLink>
        <NavLink to="/profile" style={linkStyle}>👤 Profile</NavLink>
        <NavLink to="/teams" style={linkStyle}>👥 {role === "admin" ? "Team Manager" : "My Team"}</NavLink>
        <NavLink to="/chat" style={linkStyle}>💬 Chat</NavLink>
        <NavLink to="/feedback" style={linkStyle}>📝 Feedback</NavLink>
        {role === "admin" && <NavLink to="/admin" style={linkStyle}>⚙️ Admin Panel</NavLink>}
        {role === "admin" && <NavLink to="/admin/feedback" style={linkStyle}>📋 Feedback Reviews</NavLink>}
        {currentUser?.email === "easwarasrisaivenkat.a@gmail.com" && <NavLink to="/super-admin" style={linkStyle}>🔐 Super Admin</NavLink>}
      </nav>

      <div style={s.footer}>
        {/* Request Admin — only for members */}
        {role !== "admin" && (
          requestStatus === "sent" ? (
            <div style={s.requestSent}>✓ Admin request sent</div>
          ) : (
            <button
              style={s.requestBtn}
              onClick={handleRequestAdmin}
              disabled={requestStatus === "sending"}
            >
              {requestStatus === "sending" ? "Sending..." : "🔑 Request Admin Access"}
            </button>
          )
        )}
        <button style={s.logoutBtn} onClick={signOutUser}>Sign Out</button>
      </div>
    </aside>
  );
}

export default Sidebar;
