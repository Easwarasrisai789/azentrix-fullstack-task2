import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, onSnapshot, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useAuth } from "../context/AuthContext";
import AuthenticatedLayout from "../components/AuthenticatedLayout";
import BoardCard from "../components/BoardCard";
import StatsCard from "../components/StatsCard";
import RecentActivity from "../components/RecentActivity";

const s = {
  page: { display: "grid", gap: 26 },
  hero: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 28, flexWrap: "wrap", background: "linear-gradient(135deg, #0f172a, #1e293b)", color: "white", borderRadius: 14, padding: "28px 32px" },
  heroMetrics: { display: "flex", gap: 22, flexWrap: "wrap" },
  metric: { textAlign: "center", minWidth: 80 },
  metricLabel: { margin: "0 0 3px", color: "#64748b", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em" },
  metricValue: { fontSize: "0.95rem", color: "#e2e8f0", fontWeight: 700 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 },
  body: { display: "grid", gridTemplateColumns: "minmax(280px, 360px) 1fr", gap: 22, alignItems: "start" },
  sidebar: { display: "grid", gap: 18 },
  card: { background: "#fff", borderRadius: 14, padding: 24, border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
  sectionTitle: { margin: "0 0 14px", fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" },
  form: { display: "grid", gap: 12 },
  input: { width: "100%", padding: "11px 14px", borderRadius: 9, border: "1.5px solid #d1d5db", fontSize: "0.88rem", boxSizing: "border-box" },
  textarea: { width: "100%", padding: "11px 14px", borderRadius: 9, border: "1.5px solid #d1d5db", fontSize: "0.88rem", resize: "vertical", minHeight: 70, boxSizing: "border-box" },
  btn: { padding: "11px 18px", borderRadius: 9, background: "#1d4ed8", color: "white", border: "none", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", boxShadow: "0 2px 6px rgba(29,78,216,0.25)" },
  error: { color: "#dc2626", fontSize: "0.82rem", marginTop: 6 },
  eyebrow: { textTransform: "uppercase", letterSpacing: "0.12em", fontSize: "0.7rem", fontWeight: 700, color: "#1d4ed8", margin: "0 0 4px" },
  boardsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 },
  empty: { textAlign: "center", padding: "40px 24px", color: "#64748b", background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb" },
  loading: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "55vh", gap: 14 },
  spinner: { width: 36, height: 36, border: "3px solid #e5e7eb", borderTopColor: "#1d4ed8", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
};

function Dashboard() {
  const navigate = useNavigate();
  const { currentUser, role, loading } = useAuth();
  const [boards, setBoards] = useState([]);
  const [teams, setTeams] = useState([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [totalMembers, setTotalMembers] = useState(0);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardDescription, setNewBoardDescription] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => { if (!db) return; const q = query(collection(db, "boards"), orderBy("createdAt", "desc")); return onSnapshot(q, (snap) => { setBoards(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); }); }, []);

  useEffect(() => {
    if (!db) return;
    async function load() {
      try {
        const teamsSnap = await getDocs(collection(db, "teams"));
        const loaded = teamsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setTeams(loaded);
        const usersSnap = await getDocs(collection(db, "users"));
        setTotalMembers(usersSnap.size);
        let total = 0, done = 0;
        for (const team of loaded) { const ts = await getDocs(collection(db, "teams", team.id, "tasks")); total += ts.size; ts.docs.forEach((t) => { if (t.data().status === "Done") done++; }); }
        for (const board of boards) { const ts = await getDocs(collection(db, "boards", board.id, "tasks")); total += ts.size; ts.docs.forEach((t) => { if (t.data().status === "Done") done++; }); }
        setTotalTasks(total); setCompletedTasks(done); setPendingTasks(total - done);
      } catch (e) { console.error(e); }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boards]);

  const handleCreateBoard = async (e) => {
    e.preventDefault(); setError(null);
    if (role !== "admin") { setError("Only admins can create boards."); return; }
    if (!newBoardName.trim()) { setError("Board name required."); return; }
    if (!db || !currentUser) return;
    await addDoc(collection(db, "boards"), { name: newBoardName, description: newBoardDescription, createdBy: currentUser.uid, createdByEmail: currentUser.email, createdAt: serverTimestamp() });
    setNewBoardName(""); setNewBoardDescription("");
  };

  const handleDeleteBoard = async (board) => {
    if (!window.confirm(`Delete "${board.name}"?`)) return;
    if (!db) return;
    await deleteDoc(doc(db, "boards", board.id));
  };

  if (loading) return <AuthenticatedLayout><div style={s.loading}><div style={s.spinner} /><span style={{ color: "#64748b", fontSize: "0.88rem" }}>Loading...</span></div></AuthenticatedLayout>;

  return (
    <AuthenticatedLayout>
      <div style={s.page}>
        <div style={s.hero}>
          <div>
            <p style={s.eyebrow}>Welcome back</p>
            <h1 style={{ margin: "6px 0 6px", fontSize: "1.5rem", fontWeight: 800 }}>Team Dashboard</h1>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.88rem" }}>Your workspace overview.</p>
          </div>
          <div style={s.heroMetrics}>
            <div style={s.metric}><p style={s.metricLabel}>Tasks</p><strong style={s.metricValue}>{totalTasks}</strong></div>
            <div style={s.metric}><p style={s.metricLabel}>Done</p><strong style={s.metricValue}>{completedTasks}</strong></div>
            <div style={s.metric}><p style={s.metricLabel}>Pending</p><strong style={s.metricValue}>{pendingTasks}</strong></div>
          </div>
        </div>

        <div style={s.grid}>
          <StatsCard title="Teams" value={teams.length} subtitle="Active team groups." />
          <StatsCard title="Boards" value={boards.length} subtitle="Project boards." />
          <StatsCard title="Members" value={totalMembers} subtitle="Registered users." />
          <StatsCard title="Role" value={role === "admin" ? "Admin" : "Member"} subtitle={role === "admin" ? "Full workspace access." : "Manage assigned tasks."} />
        </div>

        <div style={s.body}>
          <aside style={s.sidebar}>
            <div style={s.card}>
              <h2 style={s.sectionTitle}>{role === "admin" ? "Add Project" : "Getting Started"}</h2>
              {role === "admin" ? (
                <form onSubmit={handleCreateBoard} style={s.form}>
                  <input style={s.input} value={newBoardName} onChange={(e) => setNewBoardName(e.target.value)} placeholder="Project name" />
                  <textarea style={s.textarea} value={newBoardDescription} onChange={(e) => setNewBoardDescription(e.target.value)} placeholder="Project description" rows={3} />
                  <button style={s.btn} type="submit">Add Project</button>
                  {error && <p style={s.error}>{error}</p>}
                </form>
              ) : (
                <p style={{ margin: 0, color: "#64748b", fontSize: "0.85rem" }}>Only admins can create boards. Contact your admin.</p>
              )}
            </div>
            <RecentActivity />
          </aside>

          <section>
            <p style={s.eyebrow}>Projects</p>
            <h2 style={{ ...s.sectionTitle, marginBottom: 16 }}>Company Projects</h2>
            {boards.length === 0 ? (
              <div style={s.empty}><h3 style={{ margin: "0 0 6px" }}>No boards yet</h3><p style={{ margin: 0 }}>{role === "admin" ? "Create your first board." : "Ask an admin to create one."}</p></div>
            ) : (
              <div style={s.boardsGrid}>{boards.map((b) => <BoardCard key={b.id} board={b} isAdmin={role === "admin"} onDelete={handleDeleteBoard} />)}</div>
            )}
          </section>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

export default Dashboard;
