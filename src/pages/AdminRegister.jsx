import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, doc, getDocs, limit, query, where, writeBatch } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import { useAuth } from "../context/AuthContext";
import AuthenticatedLayout from "../components/AuthenticatedLayout";
import Navbar from "../components/Navbar";

function AdminRegister() {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [empId, setEmpId] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isBootstrap, setIsBootstrap] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    if (!db) {
      setCheckingSetup(false);
      return;
    }

    async function checkSetup() {
      try {
        const adminQuery = query(
          collection(db, "users"),
          where("role", "==", "admin"),
          limit(1)
        );
        const snap = await getDocs(adminQuery);
        setIsBootstrap(snap.empty);
      } catch {
        setIsBootstrap(false);
      } finally {
        setCheckingSetup(false);
      }
    }

    checkSetup();
  }, []);

  const handleBootstrapSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullName.trim() || !age.toString().trim() || !empId.trim() || !jobRole.trim() || !email.trim() || !password.trim()) {
      setError("All fields are required to create an admin user.");
      return;
    }

    if (!auth || !db) {
      setError("Firebase not configured. Paste config in src/firebase/firebaseConfig.js");
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const batch = writeBatch(db);
      batch.set(doc(db, "users", userCred.user.uid), {
        email: userCred.user.email,
        role: "admin",
        fullName: fullName.trim(),
        age: Number(age),
        empId: empId.trim(),
        jobRole: jobRole.trim().toLowerCase(),
        createdAt: new Date(),
      });
      batch.set(doc(db, "meta", "bootstrap"), {
        complete: true,
        createdAt: new Date(),
      });
      await batch.commit();
      setSuccess("First admin created. Redirecting to admin panel...");
      setTimeout(() => navigate("/admin"), 1400);
    } catch (err) {
      setError(err.message);
    }
  };

  if (authLoading || checkingSetup) {
    return <div className="center-content" style={{ minHeight: "70vh" }}>Loading...</div>;
  }

  if (!isBootstrap) {
    const content = (
      <div className="dashboard-page" style={{ paddingTop: 0 }}>
        <div className="card" style={{ maxWidth: 560, margin: "0 auto" }}>
          <p className="eyebrow">Admin registration</p>
          <h1>Add administrators</h1>
          <p className="text-muted">
            New admins should register as members first. Then promote them from the Admin Panel
            using their email address.
          </p>
          <button className="button-primary" onClick={() => navigate("/admin")}>
            Go to Admin Panel
          </button>
        </div>
      </div>
    );

    if (role === "admin") {
      return <AuthenticatedLayout>{content}</AuthenticatedLayout>;
    }

    return (
      <div className="page">
        <Navbar variant="public" />
        <div className="page-content">{content}</div>
      </div>
    );
  }

  return (
    <div className="page">
      <Navbar variant="public" />
      <div className="page-content" style={{ paddingTop: 24 }}>
        <div className="dashboard-header">
          <div>
            <p className="eyebrow">Initial setup</p>
            <h1>Create the first admin</h1>
            <p className="text-muted">
              No admin exists yet. Set up the first administrator account to manage your workspace.
            </p>
          </div>
        </div>

        <div className="card" style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 className="section-title">Admin account details</h2>
          <form onSubmit={handleBootstrapSubmit} className="form-card">
            <input
              className="form-input"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <input
              className="form-input"
              placeholder="Age"
              type="number"
              min="18"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
            <input
              className="form-input"
              placeholder="Employee ID"
              value={empId}
              onChange={(e) => setEmpId(e.target.value)}
            />
            <input
              className="form-input"
              placeholder="Job role (frontend, fullstack, backend)"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
            />
            <input
              className="form-input"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="form-input"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="button-primary" type="submit">
              Create First Admin
            </button>
          </form>
          {error && <p className="error-text">{error}</p>}
          {success && <p className="text-muted">{success}</p>}
        </div>
      </div>
    </div>
  );
}

export default AdminRegister;
