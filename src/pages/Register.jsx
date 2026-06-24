import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import { useAuth } from "../context/AuthContext";

const s = {
  page: { minHeight: "100vh", background: "#f7f8fa" },
  center: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 60px)", padding: 24 },
  card: { maxWidth: 480, width: "100%", background: "#fff", borderRadius: 16, padding: "36px 32px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb" },
  heading: { margin: "0 0 6px", fontSize: "1.5rem", fontWeight: 800, textAlign: "center", color: "#0f172a" },
  sub: { margin: 0, textAlign: "center", color: "#64748b", fontSize: "0.88rem" },
  form: { display: "grid", gap: 14, marginTop: 24 },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  label: { fontSize: "0.78rem", fontWeight: 600, color: "#334155", marginBottom: 4, display: "block" },
  input: { width: "100%", padding: "12px 16px", borderRadius: 9, border: "1.5px solid #d1d5db", fontSize: "0.88rem", boxSizing: "border-box", outline: "none" },
  btn: { width: "100%", padding: "13px 20px", borderRadius: 9, background: "#1d4ed8", color: "white", border: "none", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", boxShadow: "0 2px 6px rgba(29,78,216,0.3)" },
  link: { background: "none", border: "none", color: "#1d4ed8", cursor: "pointer", fontWeight: 500, fontSize: "0.85rem", padding: 0 },
  error: { color: "#dc2626", fontSize: "0.82rem", marginTop: 10 },
};

function Register() {
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(""); const [age, setAge] = useState("");
  const [empId, setEmpId] = useState(""); const [jobRole, setJobRole] = useState("");
  const [error, setError] = useState(null); const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(null);
    if (!fullName.trim() || !age.trim() || !empId.trim() || !jobRole.trim()) { setError("All fields are required."); return; }
    if (!auth || !db) { setError("Firebase not configured."); return; }
    setSubmitting(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // Check if empId is already taken (now authenticated, can read Firestore)
      const empIdCheck = await getDocs(query(collection(db, "users"), where("empId", "==", empId.trim())));
      if (!empIdCheck.empty) {
        // Delete the just-created auth account since empId is taken
        await cred.user.delete();
        setError("This Employee ID is already registered. Please use a unique ID.");
        setSubmitting(false);
        return;
      }

      await setDoc(doc(db, "users", cred.user.uid), { email: cred.user.email, role: "member", jobRole: jobRole.trim().toLowerCase(), fullName, age: Number(age), empId: empId.trim(), createdAt: new Date() });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const code = err.code;
      if (code === "auth/email-already-in-use") {
        setError("This email is already registered. Please login instead.");
      } else if (code === "auth/weak-password") {
        setError("Password must be at least 6 characters.");
      } else if (code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError(err.message);
      }
    } finally { setSubmitting(false); }
  };

  useEffect(() => { if (!loading && currentUser) navigate("/dashboard", { replace: true }); }, [currentUser, loading, navigate]);
  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}><span style={{ color: "#64748b" }}>Loading...</span></div>;

  return (
    <div style={s.page}>
      <Navbar variant="public" />
      <div style={s.center}>
        <div style={s.card}>
          <h2 style={s.heading}>Create your account</h2>
          <p style={s.sub}>Join CollabBoard and start collaborating.</p>
          <form onSubmit={handleSubmit} style={s.form}>
            <div style={s.row}>
              <div><label style={s.label}>Full Name</label><input style={s.input} placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
              <div><label style={s.label}>Age</label><input style={s.input} placeholder="25" type="number" min="18" value={age} onChange={(e) => setAge(e.target.value)} /></div>
            </div>
            <div style={s.row}>
              <div><label style={s.label}>Employee ID</label><input style={s.input} placeholder="EMP-001" value={empId} onChange={(e) => setEmpId(e.target.value)} /></div>
              <div><label style={s.label}>Job Role</label><input style={s.input} placeholder="frontend" value={jobRole} onChange={(e) => setJobRole(e.target.value)} /></div>
            </div>
            <div><label style={s.label}>Email</label><input style={s.input} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><label style={s.label}>Password</label><input style={s.input} type="password" placeholder="Choose a strong password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <button type="submit" style={{ ...s.btn, opacity: submitting ? 0.6 : 1 }} disabled={submitting}>{submitting ? "Creating..." : "Create Account"}</button>
          </form>
          {error && <p style={s.error}>{error}</p>}
          <p style={{ textAlign: "center", marginTop: 20, fontSize: "0.85rem", color: "#64748b" }}>Already have an account? <button style={s.link} onClick={() => navigate("/login")}>Sign in</button></p>
        </div>
      </div>
    </div>
  );
}

export default Register;
