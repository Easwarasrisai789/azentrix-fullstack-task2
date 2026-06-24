import React, { useEffect, useState, useRef } from "react";
import {
  collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, getDocs, where,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { useSearchParams } from "react-router-dom";
import { db } from "../firebase/firebaseConfig";
import AuthenticatedLayout from "../components/AuthenticatedLayout";

const s = {
  wrapper: { display: "grid", gridTemplateColumns: "320px 1fr", height: "calc(100vh - 64px)", borderRadius: 24, overflow: "hidden", background: "#ffffff", boxShadow: "0 20px 60px rgba(15,23,42,0.12)", border: "1px solid #e2e8f0" },
  sidebar: { background: "#0f172a", color: "#fff", display: "flex", flexDirection: "column", overflow: "hidden" },
  sidebarTop: { padding: "20px 20px 0", display: "flex", flexDirection: "column", gap: 14 },
  sidebarTitle: { margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#fff" },
  tabs: { display: "flex", gap: 0, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,.1)" },
  tab: { flex: 1, padding: "10px 0", border: "none", background: "transparent", color: "#94a3b8", fontSize: ".82rem", fontWeight: 600, cursor: "pointer", textAlign: "center" },
  tabActive: { background: "rgba(79,70,229,.3)", color: "#c7d2fe" },
  searchWrap: { padding: "12px 20px" },
  searchInput: { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.05)", color: "#fff", fontSize: ".85rem", outline: "none", boxSizing: "border-box" },
  teamsList: { flex: 1, overflowY: "auto", padding: "4px 12px 12px", display: "flex", flexDirection: "column", gap: 4 },
  teamBtn: { display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 14, border: "none", background: "transparent", width: "100%", textAlign: "left", cursor: "pointer", transition: "all .2s" },
  teamBtnActive: { background: "rgba(255,255,255,.1)" },
  teamAvatar: { width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg,#4f46e5,#8b5cf6)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: ".95rem", flexShrink: 0 },
  dmAvatar: { width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg,#059669,#10b981)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: ".95rem", flexShrink: 0 },
  teamName: { fontSize: ".9rem", fontWeight: 600, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  teamNameActive: { color: "#fff" },
  teamSub: { fontSize: ".72rem", color: "#64748b", display: "block" },
  teamSubActive: { color: "#94a3b8" },
  main: { display: "flex", flexDirection: "column", overflow: "hidden", background: "linear-gradient(135deg,#f8fafc,#eef2ff)" },
  topbar: { padding: "20px 28px", background: "#fff", borderBottom: "1px solid #e2e8f0" },
  topbarTitle: { margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#0f172a" },
  topbarSub: { margin: "3px 0 0", color: "#64748b", fontSize: ".8rem" },
  chatWindow: { flex: 1, overflowY: "auto", padding: "28px", display: "flex", flexDirection: "column", gap: 14 },
  emptyChat: { textAlign: "center", margin: "auto", color: "#64748b" },
  msgRow: { display: "flex" },
  msgRowMine: { justifyContent: "flex-end" },
  msgRowOther: { justifyContent: "flex-start" },
  msgBubble: { maxWidth: "55%", padding: "13px 17px", borderRadius: "18px 18px 18px 4px", background: "#1e293b", color: "#f1f5f9", border: "none", boxShadow: "0 2px 8px rgba(0,0,0,.08)" },
  msgBubbleMine: { background: "linear-gradient(135deg,#4f46e5,#6366f1)", color: "#fff", borderRadius: "18px 18px 4px 18px" },
  msgHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 5 },
  msgSender: { fontSize: ".72rem", fontWeight: 700, color: "#94a3b8" },
  msgSenderMine: { color: "#dbeafe" },
  msgTime: { fontSize: ".65rem", color: "#64748b" },
  msgTimeMine: { color: "#c7d2fe" },
  msgText: { margin: 0, fontSize: ".92rem", lineHeight: 1.6 },
  form: { display: "flex", alignItems: "center", gap: 12, padding: "18px 28px", background: "#fff", borderTop: "1px solid #e2e8f0" },
  input: { flex: 1, height: 52, borderRadius: 18, border: "1px solid #cbd5e1", background: "#f8fafc", padding: "0 20px", fontSize: "14px", outline: "none", boxSizing: "border-box" },
  sendBtn: { width: 52, height: 52, borderRadius: "50%", border: "none", background: "linear-gradient(135deg,#4f46e5,#6366f1)", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "16px", boxShadow: "0 8px 20px rgba(79,70,229,.3)", display: "grid", placeItems: "center" },
  sendBtnDisabled: { opacity: 0.4, cursor: "not-allowed" },
  loading: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 14 },
  spinner: { width: 36, height: 36, border: "3px solid #e5e7eb", borderTopColor: "#4f46e5", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
};

function Chat() {
  const { currentUser, role } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(searchParams.get("teamId") || "");
  const [selectedDmUser, setSelectedDmUser] = useState(null);
  const [chatMode, setChatMode] = useState("teams");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [dmUnread, setDmUnread] = useState({});   // { odlkjd_uid: 3 }
  const [teamUnread, setTeamUnread] = useState({}); // { teamId: 5 }
  const messagesEndRef = useRef(null);

  // Helper: get last read time for a conversation
  const getLastRead = (convoId) => {
    const val = localStorage.getItem(`chat_read_${currentUser?.uid}_${convoId}`);
    return val ? new Date(val) : new Date(0);
  };

  // Helper: mark a conversation as read NOW
  const markAsRead = (convoId) => {
    if (!currentUser) return;
    localStorage.setItem(`chat_read_${currentUser.uid}_${convoId}`, new Date().toISOString());
  };

  // Load teams and users
  useEffect(() => {
    if (!db || !currentUser) return;
    async function load() {
      try {
        const teamsSnap = await getDocs(collection(db, "teams"));
        const loaded = teamsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setTeams(loaded);

        const usersSnap = await getDocs(collection(db, "users"));
        setUsers(usersSnap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((u) => u.id !== currentUser.uid));

        const myTeams = loaded.filter((t) => role === "admin" || t.members?.includes(currentUser.uid));
        if (!selectedTeamId && myTeams.length > 0 && chatMode === "teams") {
          setSelectedTeamId(myTeams[0].id);
          setSearchParams({ teamId: myTeams[0].id });
        }
      } catch (err) { setError(err.message); }
      finally { setPageLoading(false); }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, role]);

  // Listen to ALL team messages for unread counts
  useEffect(() => {
    if (!db || !currentUser) return;
    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const counts = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        if (data.uid === currentUser.uid) return; // skip own messages
        const created = data.createdAt?.toDate?.();
        if (!created) return;
        const lastRead = getLastRead(data.teamId);
        if (created > lastRead) {
          counts[data.teamId] = (counts[data.teamId] || 0) + 1;
        }
      });
      setTeamUnread(counts);
    }, () => {});
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Listen to ALL DMs for unread counts
  useEffect(() => {
    if (!db || !currentUser) return;
    const q = query(collection(db, "directMessages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const counts = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        if (!data.dmId?.includes(currentUser.uid)) return; // not my convo
        if (data.uid === currentUser.uid) return; // skip own messages
        const created = data.createdAt?.toDate?.();
        if (!created) return;
        const lastRead = getLastRead(data.dmId);
        if (created > lastRead) {
          counts[data.dmId] = (counts[data.dmId] || 0) + 1;
        }
      });
      setDmUnread(counts);
    }, () => {});
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Listen to team messages for current conversation
  useEffect(() => {
    if (!db || !selectedTeamId || chatMode !== "teams" || !currentUser) return;
    const team = teams.find((t) => t.id === selectedTeamId);
    if (!team) return;
    if (role !== "admin" && !team.members?.includes(currentUser.uid)) { setMessages([]); return; }
    const q = query(collection(db, "messages"), where("teamId", "==", selectedTeamId), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => { setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); }, (err) => setError(err.message));
    // Mark as read when opening this team
    markAsRead(selectedTeamId);
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTeamId, teams, currentUser, role, chatMode]);

  // Listen to DM messages for current conversation
  useEffect(() => {
    if (!db || !selectedDmUser || chatMode !== "direct" || !currentUser) return;
    const dmId = [currentUser.uid, selectedDmUser.id].sort().join("_");
    const q = query(collection(db, "directMessages"), where("dmId", "==", dmId), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => { setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); }, (err) => setError(err.message));
    // Mark as read when opening this DM
    markAsRead(dmId);
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDmUser, currentUser, chatMode]);

  // Auto-scroll and mark as read on new messages
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // ESC key — close current conversation
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        if (chatMode === "teams") { setSelectedTeamId(""); setMessages([]); }
        else { setSelectedDmUser(null); setMessages([]); }
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [chatMode]);
  useEffect(() => {
    if (!currentUser) return;
    if (chatMode === "teams" && selectedTeamId) markAsRead(selectedTeamId);
    if (chatMode === "direct" && selectedDmUser) {
      const dmId = [currentUser.uid, selectedDmUser.id].sort().join("_");
      markAsRead(dmId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const availableTeams = teams.filter((t) => role === "admin" || t.members?.includes(currentUser?.uid));
  const selectedTeam = availableTeams.find((t) => t.id === selectedTeamId);

  const filteredUsers = users.filter((u) => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return u.empId?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  // Get unread count for a specific DM user
  const getDmUnreadCount = (userId) => {
    const dmId = [currentUser.uid, userId].sort().join("_");
    return dmUnread[dmId] || 0;
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !db || !currentUser) return;
    setSending(true);
    try {
      if (chatMode === "teams" && selectedTeamId) {
        await addDoc(collection(db, "messages"), { text: text.trim(), sender: currentUser.email, uid: currentUser.uid, teamId: selectedTeamId, createdAt: serverTimestamp() });
      } else if (chatMode === "direct" && selectedDmUser) {
        const dmId = [currentUser.uid, selectedDmUser.id].sort().join("_");
        await addDoc(collection(db, "directMessages"), { text: text.trim(), sender: currentUser.email, uid: currentUser.uid, dmId, createdAt: serverTimestamp() });
      }
      setText("");
    } catch (err) { setError(err.message); }
    finally { setSending(false); }
  };

  const switchToTeams = () => { setChatMode("teams"); setSelectedDmUser(null); setMessages([]); };
  const switchToDirect = () => { setChatMode("direct"); setSelectedTeamId(""); setMessages([]); };
  const selectDmUser = (user) => { setSelectedDmUser(user); setMessages([]); };

  if (pageLoading) return <AuthenticatedLayout><div style={s.loading}><div style={s.spinner} /><span style={{ color: "#64748b" }}>Loading chat...</span></div></AuthenticatedLayout>;

  const chatTitle = chatMode === "teams"
    ? (selectedTeam ? `# ${selectedTeam.name}` : "Select a team")
    : (selectedDmUser ? `💬 ${selectedDmUser.fullName || selectedDmUser.email}` : "Select a user");

  const chatSubtitle = chatMode === "teams"
    ? `${messages.length} messages`
    : (selectedDmUser ? selectedDmUser.email : "Search and select a user to chat");

  const canSend = chatMode === "teams" ? !!selectedTeam : !!selectedDmUser;

  return (
    <AuthenticatedLayout>
      <div style={s.wrapper}>
        {/* Sidebar */}
        <aside style={s.sidebar}>
          <div style={s.sidebarTop}>
            <h2 style={s.sidebarTitle}>💬 Messages</h2>
            {/* Tabs */}
            <div style={s.tabs}>
              <button style={{ ...s.tab, ...(chatMode === "teams" ? s.tabActive : {}) }} onClick={switchToTeams}>Teams</button>
              <button style={{ ...s.tab, ...(chatMode === "direct" ? s.tabActive : {}) }} onClick={switchToDirect}>Direct</button>
            </div>
          </div>

          {/* Search (only in direct mode) */}
          {chatMode === "direct" && (
            <div style={s.searchWrap}>
              <input style={s.searchInput} placeholder="Search by Emp ID or email..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
            </div>
          )}

          <div style={s.teamsList}>
            {chatMode === "teams" ? (
              availableTeams.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: ".82rem", padding: "16px 8px" }}>You're not in any team yet.</p>
              ) : (
                availableTeams.map((team) => {
                  const active = selectedTeamId === team.id;
                  const unread = teamUnread[team.id] || 0;
                  return (
                    <button key={team.id} style={{ ...s.teamBtn, ...(active ? s.teamBtnActive : {}) }} onClick={() => { setSelectedTeamId(team.id); setSearchParams({ teamId: team.id }); }}>
                      <div style={s.teamAvatar}>{team.name?.charAt(0).toUpperCase()}</div>
                      <div style={{ overflow: "hidden", flex: 1 }}>
                        <strong style={{ ...s.teamName, ...(active ? s.teamNameActive : {}) }}>{team.name}</strong>
                        <span style={{ ...s.teamSub, ...(active ? s.teamSubActive : {}) }}>{team.members?.length || 0} members</span>
                      </div>
                      {unread > 0 && !active && (
                        <span style={{ background: "#ef4444", color: "white", fontSize: ".65rem", fontWeight: 700, padding: "3px 7px", borderRadius: 999, minWidth: 18, textAlign: "center" }}>{unread}</span>
                      )}
                    </button>
                  );
                })
              )
            ) : (
              filteredUsers.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: ".82rem", padding: "16px 8px" }}>No users found.</p>
              ) : (
                filteredUsers.map((user) => {
                  const active = selectedDmUser?.id === user.id;
                  const unread = getDmUnreadCount(user.id);
                  return (
                    <button key={user.id} style={{ ...s.teamBtn, ...(active ? s.teamBtnActive : {}) }} onClick={() => selectDmUser(user)}>
                      <div style={s.dmAvatar}>{(user.fullName || user.email)?.charAt(0).toUpperCase()}</div>
                      <div style={{ overflow: "hidden", flex: 1 }}>
                        <strong style={{ ...s.teamName, ...(active ? s.teamNameActive : {}) }}>{user.fullName || user.email}</strong>
                        <span style={{ ...s.teamSub, ...(active ? s.teamSubActive : {}) }}>{user.empId || "—"} · {user.email}</span>
                      </div>
                      {unread > 0 && !active && (
                        <span style={{ background: "#ef4444", color: "white", fontSize: ".65rem", fontWeight: 700, padding: "3px 7px", borderRadius: 999, minWidth: 18, textAlign: "center" }}>{unread}</span>
                      )}
                    </button>
                  );
                })
              )
            )}
          </div>
        </aside>

        {/* Main Chat Area */}
        <main style={s.main}>
          <div style={s.topbar}>
            <h2 style={s.topbarTitle}>{chatTitle}</h2>
            <p style={s.topbarSub}>{chatSubtitle}</p>
          </div>
          {error && <p style={{ color: "#dc2626", padding: "8px 28px", margin: 0, fontSize: ".82rem" }}>{error}</p>}

          <div style={s.chatWindow}>
            {!canSend ? (
              <div style={s.emptyChat}>
                <h2 style={{ fontSize: "1.1rem", color: "#334155", marginBottom: 6 }}>
                  {chatMode === "teams" ? "Select a team to chat" : "Select a user to start a conversation"}
                </h2>
                <p style={{ margin: 0, fontSize: ".9rem" }}>
                  {chatMode === "direct" ? "Use the search bar to find someone." : "Pick a team from the sidebar."}
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg) => {
                  const mine = msg.uid === currentUser?.uid;
                  return (
                    <div key={msg.id} style={{ ...s.msgRow, ...(mine ? s.msgRowMine : s.msgRowOther) }}>
                      <div style={{ ...s.msgBubble, ...(mine ? s.msgBubbleMine : {}) }}>
                        <div style={s.msgHeader}>
                          <strong style={{ ...s.msgSender, ...(mine ? s.msgSenderMine : {}) }}>{msg.sender}</strong>
                          <small style={{ ...s.msgTime, ...(mine ? s.msgTimeMine : {}) }}>
                            {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "..."}
                          </small>
                        </div>
                        <p style={s.msgText}>{msg.text}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <form style={s.form} onSubmit={sendMessage}>
            <input style={s.input} type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder={canSend ? "Type a message..." : "Select a conversation"} disabled={!canSend} />
            <button type="submit" style={{ ...s.sendBtn, ...(!canSend || sending || !text.trim() ? s.sendBtnDisabled : {}) }} disabled={!canSend || sending || !text.trim()}>
              {sending ? "…" : "➤"}
            </button>
          </form>
        </main>
      </div>
    </AuthenticatedLayout>
  );
}

export default Chat;
