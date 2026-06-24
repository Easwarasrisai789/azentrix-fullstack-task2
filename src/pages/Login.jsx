import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase/firebaseConfig";
import { useAuth } from "../context/AuthContext";

const s = {
  page: { minHeight: "100vh", background: "#f7f8fa" },
  center: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 60px)", padding: 24 },
  card: { maxWidth: 420, width: "100%", background: "#fff", borderRadius: 16, padding: "36px 32px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb" },
  heading: { margin: "0 0 6px", fontSize: "1.5rem", fontWeight: 800, textAlign: "center", color: "#0f172a" },
  sub: { margin: 0, textAlign: "center", color: "#64748b", fontSize: "0.88rem" },
  form: { display: "grid", gap: 16, marginTop: 24 },
  label: { fontSize: "0.8rem", fontWeight: 600, color: "#334155", marginBottom: 5, display: "block" },
  input: { width: "100%", padding: "12px 16px", borderRadius: 9, border: "1.5px solid #d1d5db", fontSize: "0.88rem", boxSizing: "border-box", outline: "none" },
  btn: { width: "100%", padding: "13px 20px", borderRadius: 9, background: "#1d4ed8", color: "white", border: "none", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", boxShadow: "0 2px 6px rgba(29,78,216,0.3)" },
  link: { background: "none", border: "none", color: "#1d4ed8", cursor: "pointer", fontWeight: 500, fontSize: "0.85rem", padding: 0 },
  error: { color: "#dc2626", fontSize: "0.82rem", marginTop: 10 },
  info: { padding: "12px 16px", borderRadius: 10, background: "#eff6ff", border: "1px solid #dbeafe", marginBottom: 16, fontSize: "0.82rem", color: "#1e40af" },
};

function Login() {
  const navigate = useNavigate();
  const { currentUser, role, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    if (!db) return;
    async function check() { try { const snap = await getDocs(query(collection(db, "users"), where("role", "==", "admin"), limit(1))); setNeedsSetup(snap.empty); } catch {} }
    check();
  }, []);

  useEffect(() => { if (!loading && currentUser && role) navigate(role === "admin" ? "/admin" : "/dashboard", { replace: true }); }, [currentUser, role, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(null);
    if (!auth) { setError("Firebase not configured."); return; }
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const code = err.code;
      if (code === "auth/invalid-login-credentials" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        setError("Incorrect email or password. Please try again.");
      } else if (code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please try again later.");
      } else {
        setError(err.message);
      }
    } finally { setSubmitting(false); }
  };

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}><span style={{ color: "#64748b" }}>Loading...</span></div>;

  return (
    <div style={s.page}>
      <Navbar variant="public" />
      <div style={s.center}>
        <div style={s.card}>
          <h2 style={s.heading}>Welcome back</h2>
          <p style={s.sub}>Sign in to continue to your workspace.</p>
          {needsSetup && <div style={s.info}>No admin exists yet. <button style={s.link} onClick={() => navigate("/admin-register")}>Set up the first admin</button></div>}
          <form onSubmit={handleSubmit} style={s.form}>
            <div><label style={s.label}>Email</label><input style={s.input} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div><label style={s.label}>Password</label><input style={s.input} type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
            <div style={{ textAlign: "right" }}><button type="button" style={s.link} onClick={() => navigate("/forgot-password")}>Forgot Password?</button></div>
            <button type="submit" style={{ ...s.btn, opacity: submitting ? 0.6 : 1 }} disabled={submitting}>{submitting ? "Signing in..." : "Sign In"}</button>
          </form>
          {error && <p style={s.error}>{error}</p>}
          <p style={{ textAlign: "center", marginTop: 20, fontSize: "0.85rem", color: "#64748b" }}>Don't have an account? <button style={s.link} onClick={() => navigate("/register")}>Create one</button></p>
        </div>
      </div>
    </div>
  );
}

export default Login;
