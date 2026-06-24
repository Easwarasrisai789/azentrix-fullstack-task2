import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import Navbar from "../components/Navbar";

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
  success: { color: "#059669", fontSize: "0.82rem", marginTop: 12, textAlign: "center" },
  error: { color: "#dc2626", fontSize: "0.82rem", marginTop: 12, textAlign: "center" },
};

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault(); setError(""); setMessage(""); setSubmitting(true);
    try { await sendPasswordResetEmail(auth, email); setMessage("Reset email sent. Check your inbox."); }
    catch (err) { setError(err.message); } finally { setSubmitting(false); }
  };

  return (
    <div style={s.page}>
      <Navbar variant="public" />
      <div style={s.center}>
        <div style={s.card}>
          <h2 style={s.heading}>Reset Password</h2>
          <p style={s.sub}>Enter your email and we'll send a reset link.</p>
          <form onSubmit={handleReset} style={s.form}>
            <div><label style={s.label}>Email address</label><input style={s.input} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <button type="submit" style={{ ...s.btn, opacity: submitting ? 0.6 : 1 }} disabled={submitting}>{submitting ? "Sending..." : "Send Reset Link"}</button>
          </form>
          {message && <p style={s.success}>{message}</p>}
          {error && <p style={s.error}>{error}</p>}
          <p style={{ textAlign: "center", marginTop: 20 }}><button style={s.link} onClick={() => navigate("/login")}>← Back to Login</button></p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
