import React, { useMemo, useState, useRef } from "react";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase/firebaseConfig";
import { useAuth } from "../context/AuthContext";
import AuthenticatedLayout from "../components/AuthenticatedLayout";

const s = {
  page: {
    display: "grid",
    gap: 28,
    padding: 12,
    background: "linear-gradient(135deg,#f8fafc,#eef2ff)",
    minHeight: "100vh",
  },
  eyebrow: {
    textTransform: "uppercase",
    letterSpacing: "0.16em",
    fontSize: "0.72rem",
    fontWeight: 800,
    color: "#4f46e5",
    margin: "0 0 6px",
  },
  title: {
    margin: "0 0 8px",
    fontSize: "2.2rem",
    fontWeight: 800,
    color: "#0f172a",
  },
  sub: {
    margin: 0,
    color: "#64748b",
    fontSize: "1rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1.3fr 360px",
    gap: 24,
  },
  card: {
    background: "rgba(255,255,255,.85)",
    backdropFilter: "blur(20px)",
    borderRadius: 28,
    padding: 30,
    border: "1px solid rgba(255,255,255,.5)",
    boxShadow: "0 20px 60px rgba(15,23,42,.08)",
  },
  profileRow: {
    display: "flex",
    gap: 24,
    alignItems: "center",
  },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 110,
    height: 110,
    minWidth: 110,
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
    background: "linear-gradient(135deg,#4f46e5,#8b5cf6)",
    color: "white",
    fontSize: "2.8rem",
    fontWeight: 800,
    boxShadow: "0 20px 40px rgba(79,70,229,.35)",
  },
  avatarImg: {
    width: 110,
    height: 110,
    borderRadius: "50%",
    objectFit: "cover",
    boxShadow: "0 20px 40px rgba(79,70,229,.25)",
  },
  uploadBtn: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#fff",
    border: "2px solid #e5e7eb",
    display: "grid",
    placeItems: "center",
    fontSize: "0.9rem",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,.15)",
  },
  name: {
    margin: "0 0 6px",
    fontSize: "1.8rem",
    fontWeight: 800,
    color: "#0f172a",
  },
  email: {
    margin: 0,
    color: "#64748b",
    fontSize: "1rem",
  },
  btnPrimary: {
    marginTop: 16,
    padding: "12px 22px",
    borderRadius: 14,
    background: "linear-gradient(135deg,#4f46e5,#6366f1)",
    color: "white",
    border: "none",
    fontWeight: 700,
    fontSize: "0.95rem",
    cursor: "pointer",
    boxShadow: "0 10px 30px rgba(79,70,229,.3)",
  },
  summaryItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 20px",
    borderRadius: 18,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    marginBottom: 12,
  },
  summaryLabel: {
    color: "#64748b",
    fontSize: "0.9rem",
    fontWeight: 500,
  },
  summaryValue: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#0f172a",
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: 16,
    marginTop: 20,
  },
  field: {
    padding: "22px",
    borderRadius: 20,
    background: "linear-gradient(180deg,#ffffff,#f8fafc)",
    border: "1px solid #e2e8f0",
    boxShadow: "0 6px 20px rgba(15,23,42,.04)",
  },
  fieldLabel: {
    color: "#64748b",
    fontSize: "0.8rem",
    fontWeight: 600,
    marginBottom: 10,
    display: "block",
    textTransform: "uppercase",
    letterSpacing: ".06em",
  },
  fieldValue: {
    fontSize: "1.15rem",
    fontWeight: 700,
    color: "#0f172a",
  },
  form: {
    display: "grid",
    gap: 16,
    marginTop: 28,
    paddingTop: 24,
    borderTop: "1px solid #e2e8f0",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 14,
    border: "1.5px solid #cbd5e1",
    background: "#fff",
    fontSize: "0.95rem",
    boxSizing: "border-box",
    outline: "none",
  },
  label: {
    fontSize: "0.82rem",
    fontWeight: 700,
    color: "#334155",
    marginBottom: 6,
    display: "block",
  },
  btnRow: {
    display: "flex",
    gap: 12,
  },
  btnSecondary: {
    padding: "12px 22px",
    borderRadius: 14,
    background: "#fff",
    color: "#334155",
    border: "1px solid #cbd5e1",
    fontWeight: 700,
    cursor: "pointer",
  },
  error: {
    color: "#dc2626",
    fontSize: "0.9rem",
    marginTop: 12,
    fontWeight: 600,
  },
  success: {
    color: "#059669",
    fontSize: "0.9rem",
    marginTop: 12,
    fontWeight: 600,
  },
  loading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    gap: 16,
  },
  spinner: {
    width: 42,
    height: 42,
    border: "4px solid #e5e7eb",
    borderTopColor: "#4f46e5",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};

function Profile() {
  const { currentUser, userData, role, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(!userData?.fullName || !userData?.empId || !userData?.jobRole);
  const [fullName, setFullName] = useState(userData?.fullName || "");
  const [age, setAge] = useState(userData?.age ?? "");
  const [empId, setEmpId] = useState(userData?.empId || "");
  const [jobRole, setJobRole] = useState(userData?.jobRole || "");
  const [status, setStatus] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [localPhotoURL, setLocalPhotoURL] = useState(null);
  const fileInputRef = useRef(null);

  const displayName = useMemo(() => userData?.fullName || currentUser?.displayName || currentUser?.email?.split("@")[0] || "Member", [currentUser, userData]);
  const email = currentUser?.email || "No email";
  const profilePic = localPhotoURL || userData?.photoURL || null;
  const profileRole = userData?.role || role || "Member";
  const joined = currentUser?.metadata?.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString() : "Unknown";

  const handleStartEdit = () => { setFullName(userData?.fullName || ""); setAge(userData?.age ?? ""); setEmpId(userData?.empId || ""); setJobRole(userData?.jobRole || ""); setStatus(null); setIsEditing(true); };

  const handleSave = async (e) => {
    e.preventDefault(); if (!currentUser) return; setStatus(null);
    if (!fullName.trim() || !age.toString().trim() || !empId.trim() || !jobRole.trim()) { setStatus({ type: "error", message: "All fields required." }); return; }
    try {
      // Check empId uniqueness (skip if it hasn't changed)
      if (empId.trim() !== userData?.empId) {
        const empIdCheck = await getDocs(query(collection(db, "users"), where("empId", "==", empId.trim())));
        if (!empIdCheck.empty) { setStatus({ type: "error", message: "This Employee ID is already taken." }); return; }
      }
      await setDoc(doc(db, "users", currentUser.uid), { email: currentUser.email, role: profileRole === "admin" ? "admin" : "member", jobRole: jobRole.trim().toLowerCase(), fullName: fullName.trim(), age: Number(age), empId: empId.trim(), photoURL: userData?.photoURL || null }, { merge: true });
      setStatus({ type: "success", message: "Profile updated." }); setIsEditing(false);
    } catch (err) { setStatus({ type: "error", message: err.message }); }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !storage) return;
    if (!file.type.startsWith("image/")) { setStatus({ type: "error", message: "Select an image." }); return; }
    if (file.size > 5 * 1024 * 1024) { setStatus({ type: "error", message: "Max 5MB." }); return; }
    setUploading(true); setStatus(null);
    try {
      const storageRef = ref(storage, `profilePics/${currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await setDoc(doc(db, "users", currentUser.uid), { photoURL: url }, { merge: true });
      setLocalPhotoURL(url); setStatus({ type: "success", message: "Photo updated!" });
    } catch (err) { setStatus({ type: "error", message: err.code === "storage/unauthorized" ? "Enable Storage rules in Firebase." : err.message }); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  if (loading) return <AuthenticatedLayout><div style={s.loading}><div style={s.spinner} /><span style={{ color: "#64748b" }}>Loading...</span></div></AuthenticatedLayout>;

  const isProfileComplete = userData?.fullName && userData?.empId && userData?.jobRole;

  return (
    <AuthenticatedLayout>
      <div style={s.page}>
        {/* Incomplete profile banner */}
        {!isProfileComplete && (
          <div style={{ padding: "18px 24px", borderRadius: 16, background: "linear-gradient(135deg, #fef3c7, #fffbeb)", border: "1px solid #fde68a", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: "1.4rem" }}>⚠️</span>
            <div>
              <strong style={{ color: "#92400e", fontSize: "0.95rem" }}>Complete your profile to continue</strong>
              <p style={{ margin: "4px 0 0", color: "#a16207", fontSize: "0.85rem" }}>Please fill in your Full Name, Employee ID, and Job Role below before accessing the workspace.</p>
            </div>
          </div>
        )}

        <div><p style={s.eyebrow}>Profile</p><h1 style={s.title}>Account Overview</h1><p style={s.sub}>Your membership details and settings.</p></div>

        <div style={s.grid}>
          <div style={s.card}>
            <div style={s.profileRow}>
              <div style={s.avatarWrap}>
                {profilePic ? <img src={profilePic} alt="Profile" style={s.avatarImg} /> : <div style={s.avatar}>{displayName.charAt(0).toUpperCase()}</div>}
                <button style={s.uploadBtn} onClick={() => fileInputRef.current?.click()} disabled={uploading}>{uploading ? "…" : "📷"}</button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: "none" }} />
              </div>
              <div>
                <h2 style={s.name}>{displayName}</h2>
                <p style={s.email}>{email}</p>
                <button style={s.btnPrimary} onClick={handleStartEdit}>Edit Profile</button>
              </div>
            </div>

            {/* Bio / Self Intro */}
            <div style={{ marginTop: 20, padding: "18px 22px", borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>About</p>
              <p style={{ margin: 0, fontSize: "0.92rem", color: "#334155", lineHeight: 1.7 }}>
                {userData?.bio || `Hi, I'm ${displayName}. I work as a ${userData?.jobRole || "team member"} with Employee ID ${userData?.empId || "—"}. Joined the team to collaborate, deliver projects, and grow professionally.`}
              </p>
            </div>

            {/* Quick Info */}
            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div style={{ padding: "14px 16px", borderRadius: 12, background: "#eff6ff", border: "1px solid #dbeafe", textAlign: "center" }}>
                <p style={{ margin: "0 0 4px", fontSize: "0.7rem", color: "#1e40af", fontWeight: 600, textTransform: "uppercase" }}>Role</p>
                <strong style={{ fontSize: "0.88rem", color: "#1e40af" }}>{userData?.jobRole || "—"}</strong>
              </div>
              <div style={{ padding: "14px 16px", borderRadius: 12, background: "#f0fdf4", border: "1px solid #bbf7d0", textAlign: "center" }}>
                <p style={{ margin: "0 0 4px", fontSize: "0.7rem", color: "#166534", fontWeight: 600, textTransform: "uppercase" }}>Emp ID</p>
                <strong style={{ fontSize: "0.88rem", color: "#166534" }}>{userData?.empId || "—"}</strong>
              </div>
              <div style={{ padding: "14px 16px", borderRadius: 12, background: "#faf5ff", border: "1px solid #e9d5ff", textAlign: "center" }}>
                <p style={{ margin: "0 0 4px", fontSize: "0.7rem", color: "#6b21a8", fontWeight: 600, textTransform: "uppercase" }}>Permission</p>
                <strong style={{ fontSize: "0.88rem", color: "#6b21a8" }}>{profileRole === "admin" ? "Admin" : "Member"}</strong>
              </div>
            </div>
          </div>

          <div style={s.card}>
            <div style={s.summaryItem}><span style={s.summaryLabel}>Name</span><strong style={s.summaryValue}>{displayName}</strong></div>
            <div style={s.summaryItem}><span style={s.summaryLabel}>Age</span><strong style={s.summaryValue}>{userData?.age ?? "—"}</strong></div>
            <div style={s.summaryItem}><span style={s.summaryLabel}>Emp ID</span><strong style={s.summaryValue}>{userData?.empId || "—"}</strong></div>
            <div style={s.summaryItem}><span style={s.summaryLabel}>Job Role</span><strong style={s.summaryValue}>{userData?.jobRole || "—"}</strong></div>
            <div style={s.summaryItem}><span style={s.summaryLabel}>Permission</span><strong style={s.summaryValue}>{profileRole === "admin" ? "Admin" : "Member"}</strong></div>
          </div>
        </div>

        <div style={s.card}>
          <h2 style={{ margin: "0 0 6px", fontSize: "1.1rem", fontWeight: 700 }}>Details</h2>
          <p style={{ margin: "0 0 10px", color: "#64748b", fontSize: "0.85rem" }}>Update your information below.</p>
          <div style={s.detailGrid}>
            <div style={s.field}><span style={s.fieldLabel}>Name</span><strong style={s.fieldValue}>{displayName}</strong></div>
            <div style={s.field}><span style={s.fieldLabel}>Age</span><strong style={s.fieldValue}>{userData?.age ?? "—"}</strong></div>
            <div style={s.field}><span style={s.fieldLabel}>Emp ID</span><strong style={s.fieldValue}>{userData?.empId || "—"}</strong></div>
            <div style={s.field}><span style={s.fieldLabel}>Job Role</span><strong style={s.fieldValue}>{userData?.jobRole || "—"}</strong></div>
            <div style={s.field}><span style={s.fieldLabel}>Permission</span><strong style={s.fieldValue}>{profileRole === "admin" ? "Admin" : "Member"}</strong></div>
            <div style={s.field}><span style={s.fieldLabel}>Joined</span><strong style={s.fieldValue}>{joined}</strong></div>
          </div>

          {isEditing && (
            <form style={s.form} onSubmit={handleSave}>
              <div style={s.row}><div><label style={s.label}>Full Name</label><input style={s.input} value={fullName} onChange={(e) => setFullName(e.target.value)} /></div><div><label style={s.label}>Age</label><input style={s.input} type="number" min="18" value={age} onChange={(e) => setAge(e.target.value)} /></div></div>
              <div style={s.row}><div><label style={s.label}>Employee ID</label><input style={s.input} value={empId} onChange={(e) => setEmpId(e.target.value)} /></div><div><label style={s.label}>Job Role</label><input style={s.input} value={jobRole} onChange={(e) => setJobRole(e.target.value)} /></div></div>
              <div style={s.btnRow}><button style={s.btnPrimary} type="submit">Save</button><button style={s.btnSecondary} type="button" onClick={() => setIsEditing(false)}>Cancel</button></div>
            </form>
          )}
          {status && <p style={status.type === "error" ? s.error : s.success}>{status.message}</p>}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

export default Profile;
