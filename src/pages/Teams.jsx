import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/firebaseConfig";
import AuthenticatedLayout from "../components/AuthenticatedLayout";

const s = {
  page: { display: "grid", gap: 24 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" },
  eyebrow: { textTransform: "uppercase", letterSpacing: "0.12em", fontSize: "0.7rem", fontWeight: 700, color: "#1d4ed8", margin: "0 0 4px" },
  title: { margin: "4px 0 6px", fontSize: "1.5rem", fontWeight: 800 },
  sub: { margin: 0, color: "#64748b", fontSize: "0.88rem" },
  btn: { padding: "11px 18px", borderRadius: 9, background: "#1d4ed8", color: "white", border: "none", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", boxShadow: "0 2px 6px rgba(29,78,216,0.25)" },
  btnSec: { padding: "9px 14px", borderRadius: 8, background: "#f1f5f9", color: "#334155", border: "1px solid #d1d5db", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer" },
  panel: { display: "grid", gridTemplateColumns: "300px 1fr", gap: 22, background: "#fff", borderRadius: 14, padding: 26, border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
  panelLeft: { display: "flex", flexDirection: "column", gap: 14 },
  panelRight: { display: "flex", flexDirection: "column", gap: 10, borderLeft: "1px solid #f3f4f6", paddingLeft: 22 },
  input: { width: "100%", padding: "11px 14px", borderRadius: 9, border: "1.5px solid #d1d5db", fontSize: "0.88rem", boxSizing: "border-box" },
  select: { padding: "11px 14px", borderRadius: 9, border: "1.5px solid #d1d5db", fontSize: "0.88rem" },
  searchBar: { display: "flex", gap: 8, flexWrap: "wrap" },
  memberList: { maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 },
  memberItem: { display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, cursor: "pointer" },
  memberName: { fontSize: "0.84rem", fontWeight: 500, color: "#0f172a" },
  memberMeta: { fontSize: "0.72rem", color: "#94a3b8" },
  listHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  listTitle: { margin: 0, fontSize: "1.1rem", fontWeight: 700 },
  badge: { fontSize: "0.72rem", fontWeight: 600, color: "#64748b", background: "#f1f5f9", padding: "3px 10px", borderRadius: 999 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginTop: 12 },
  teamCard: { background: "#fff", borderRadius: 14, padding: 22, border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", gap: 14, position: "relative", overflow: "hidden" },
  teamCardBar: { position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #1d4ed8, #7c3aed)" },
  teamTop: { display: "flex", alignItems: "center", gap: 12 },
  teamAvatar: { width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #1d4ed8, #7c3aed)", color: "white", display: "grid", placeItems: "center", fontWeight: 800, fontSize: "1rem", flexShrink: 0 },
  teamName: { margin: 0, fontSize: "1rem", fontWeight: 700 },
  teamCount: { margin: "2px 0 0", fontSize: "0.78rem", color: "#64748b" },
  chips: { display: "flex", flexWrap: "wrap", gap: 5 },
  chip: { fontSize: "0.7rem", fontWeight: 500, padding: "3px 9px", borderRadius: 999, background: "#f1f5f9", color: "#475569" },
  actions: { display: "flex", gap: 8, marginTop: "auto", paddingTop: 12, borderTop: "1px solid #f3f4f6" },
  actBtn: { flex: 1, padding: "9px 12px", fontSize: "0.78rem", borderRadius: 8, fontWeight: 600, cursor: "pointer", border: "none" },
  empty: { textAlign: "center", padding: "36px 20px", color: "#64748b", background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb" },
  error: { color: "#dc2626", fontSize: "0.82rem" },
  success: { color: "#059669", fontSize: "0.82rem" },
  loading: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "55vh", gap: 14 },
  spinner: { width: 36, height: 36, border: "3px solid #e5e7eb", borderTopColor: "#1d4ed8", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
};

function Teams() {
  const { currentUser, role } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]); const [teams, setTeams] = useState([]);
  const [newTeamName, setNewTeamName] = useState(""); const [teamMembers, setTeamMembers] = useState([]);
  const [searchType, setSearchType] = useState("name"); const [searchText, setSearchText] = useState(""); const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState(null); const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false); const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => { async function load() { if (!db) return; try { const u = await getDocs(collection(db, "users")); setUsers(u.docs.map((d) => ({ id: d.id, ...d.data() }))); const t = await getDocs(collection(db, "teams")); setTeams(t.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch (e) { setError(e.message); } finally { setPageLoading(false); } } load(); }, []);

  const filteredUsers = users.filter((u) => { if (!searchQuery) return true; const q = searchQuery.toLowerCase(); return searchType === "empId" ? u.empId?.toLowerCase().includes(q) : (u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)); });
  const toggleMember = (id) => setTeamMembers((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const availableTeams = teams.filter((t) => role === "admin" || t.members?.includes(currentUser?.uid));

  const createTeam = async (e) => {
    e.preventDefault(); setError(null); setMessage(null);
    if (!newTeamName.trim()) { setError("Enter a team name."); return; }
    if (!db || !currentUser) return;
    try { const ref = await addDoc(collection(db, "teams"), { name: newTeamName.trim(), members: teamMembers, createdBy: currentUser.uid, createdAt: new Date().toISOString() }); setTeams((p) => [...p, { id: ref.id, name: newTeamName.trim(), members: teamMembers, createdBy: currentUser.uid }]); setNewTeamName(""); setTeamMembers([]); setMessage("Team created!"); setShowCreateForm(false); }
    catch (err) { setError(err.message); }
  };

  if (pageLoading) return <AuthenticatedLayout><div style={s.loading}><div style={s.spinner} /><span style={{ color: "#64748b" }}>Loading teams...</span></div></AuthenticatedLayout>;

  return (
    <AuthenticatedLayout>
      <div style={s.page}>
        <div style={s.header}>
          <div><p style={s.eyebrow}>Workspace</p><h1 style={s.title}>Team Manager</h1><p style={s.sub}>Create teams, assign members, manage groups.</p></div>
          {role === "admin" && <button style={s.btn} onClick={() => setShowCreateForm(!showCreateForm)}>{showCreateForm ? "Cancel" : "+ New Team"}</button>}
        </div>

        {error && <p style={s.error}>{error}</p>}
        {message && <p style={s.success}>{message}</p>}

        {showCreateForm && (
          <div style={s.panel}>
            <div style={s.panelLeft}>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>New Team</h3>
              <form onSubmit={createTeam} style={{ display: "grid", gap: 12 }}>
                <div><label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>Team name</label><input style={s.input} value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="e.g. Design Team" /></div>
                <button style={{ ...s.btn, width: "100%" }} type="submit">Create Team</button>
              </form>
            </div>
            <div style={s.panelRight}>
              <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700 }}>Add Members</h4>
              <form onSubmit={(e) => { e.preventDefault(); setSearchQuery(searchText); }} style={s.searchBar}>
                <select style={{ ...s.select, width: "auto", minWidth: 110 }} value={searchType} onChange={(e) => setSearchType(e.target.value)}><option value="name">By Name</option><option value="empId">By Emp ID</option></select>
                <input style={{ ...s.input, flex: 1 }} value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder={searchType === "empId" ? "Emp ID..." : "Name..."} />
                <button style={s.btnSec} type="submit">Search</button>
                {searchQuery && <button style={s.btnSec} type="button" onClick={() => { setSearchText(""); setSearchQuery(""); }}>Clear</button>}
              </form>
              <div style={s.memberList}>
                {filteredUsers.length === 0 ? <p style={{ color: "#64748b", fontSize: "0.82rem", padding: "10px 0" }}>No users found.</p> :
                  filteredUsers.map((u) => (
                    <label key={u.id} style={{ ...s.memberItem, background: teamMembers.includes(u.id) ? "#eff6ff" : "transparent" }}>
                      <input type="checkbox" checked={teamMembers.includes(u.id)} onChange={() => toggleMember(u.id)} style={{ accentColor: "#1d4ed8" }} />
                      <div><span style={s.memberName}>{u.fullName || u.email}</span><span style={{ ...s.memberMeta, display: "block" }}>{u.empId || "—"} · {u.jobRole || "—"}</span></div>
                    </label>
                  ))}
              </div>
              {teamMembers.length > 0 && <p style={{ margin: 0, fontSize: "0.78rem", color: "#1d4ed8", fontWeight: 600 }}>{teamMembers.length} selected</p>}
            </div>
          </div>
        )}

        <div>
          <div style={s.listHeader}><h2 style={s.listTitle}>Your Teams</h2><span style={s.badge}>{availableTeams.length} teams</span></div>
          {availableTeams.length === 0 ? (
            <div style={s.empty}><h3 style={{ margin: "0 0 4px" }}>No teams yet</h3><p style={{ margin: 0 }}>{role === "admin" ? "Create your first team." : "You're not in any team yet."}</p></div>
          ) : (
            <div style={s.grid}>
              {availableTeams.map((team) => (
                <div key={team.id} style={s.teamCard}>
                  <div style={s.teamCardBar} />
                  <div style={s.teamTop}>
                    <div style={s.teamAvatar}>{team.name?.charAt(0).toUpperCase()}</div>
                    <div><h3 style={s.teamName}>{team.name}</h3><p style={s.teamCount}>{team.members?.length || 0} member{(team.members?.length || 0) !== 1 ? "s" : ""}</p></div>
                  </div>
                  <div style={s.chips}>
                    {team.members?.slice(0, 4).map((mid) => { const m = users.find((u) => u.id === mid); return <span key={mid} style={s.chip}>{m?.fullName?.split(" ")[0] || m?.email?.split("@")[0] || "?"}</span>; })}
                    {team.members?.length > 4 && <span style={{ ...s.chip, background: "#dbeafe", color: "#1d4ed8" }}>+{team.members.length - 4}</span>}
                  </div>
                  <div style={s.actions}>
                    <button style={{ ...s.actBtn, background: "#1d4ed8", color: "white", boxShadow: "0 2px 6px rgba(29,78,216,0.2)" }} onClick={() => navigate(`/teams/${team.id}`)}>Open Board</button>
                    <button style={{ ...s.actBtn, background: "#f1f5f9", color: "#334155", border: "1px solid #d1d5db" }} onClick={() => navigate(`/chat?teamId=${team.id}`)}>Chat</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

export default Teams;
