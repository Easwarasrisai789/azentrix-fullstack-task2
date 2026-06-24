import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const s = {
  page: { minHeight: "100vh" },
  hero: { padding: "0 24px", background: "linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)", color: "white", position: "relative", overflow: "hidden", minHeight: "calc(100vh - 52px)", display: "flex", alignItems: "center" },
  heroGrid: { maxWidth: 1200, margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 50, alignItems: "center" },
  eyebrow: { textTransform: "uppercase", letterSpacing: "0.14em", fontSize: "0.72rem", fontWeight: 700, color: "#60a5fa", marginBottom: 10 },
  title: { fontSize: "clamp(2.2rem, 4.5vw, 3.2rem)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 18px", color: "#ffffff" },
  subtitle: { fontSize: "1.05rem", color: "#94a3b8", lineHeight: 1.7, margin: 0, maxWidth: 500 },
  actions: { marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap" },
  btnPrimary: { padding: "14px 28px", fontSize: "0.92rem", borderRadius: 10, background: "#1d4ed8", color: "white", border: "none", fontWeight: 600, cursor: "pointer", boxShadow: "0 3px 10px rgba(29,78,216,0.35)" },
  btnGhost: { padding: "14px 28px", fontSize: "0.92rem", borderRadius: 10, background: "rgba(255,255,255,0.07)", color: "white", border: "1px solid rgba(255,255,255,0.18)", fontWeight: 600, cursor: "pointer" },
  panel: { width: "100%", borderRadius: 18, padding: 22, minHeight: 340, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 30px 60px rgba(0,0,0,0.3)", backdropFilter: "blur(16px)" },
  panelDots: { display: "flex", gap: 7, marginBottom: 18 },
  dot: { width: 9, height: 9, borderRadius: 999, display: "inline-block" },
  panelCard: { padding: "12px 14px", borderRadius: 11, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: "0.85rem", marginBottom: 10 },
  panelMeta: { display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#64748b", marginTop: 8 },
  section: { padding: "60px 24px", maxWidth: 1200, margin: "0 auto" },
  sectionTitle: { margin: "0 0 8px", fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em", color: "#0f172a" },
  featureGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginTop: 36 },
  featureCard: { padding: "28px 24px", borderRadius: 16, boxShadow: "0 4px 14px rgba(0,0,0,0.08)", border: "1px solid #1e293b", background: "#0f172a", color: "white" },
  featureCardHighlight: { background: "linear-gradient(135deg, #1d4ed8, #7c3aed)", border: "none" },
  whySection: { background: "#f7f8fa", padding: "70px 24px" },
  whyInner: { maxWidth: 1100, margin: "0 auto" },
  whyGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginTop: 36 },
  whyCard: { background: "#fff", borderRadius: 14, padding: "28px 22px", textAlign: "center", border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
  footer: { background: "#0f172a", color: "#94a3b8", textAlign: "center", padding: "28px 24px", fontSize: "0.82rem" },
};

function Home() {
  const navigate = useNavigate();
  return (
    <div style={s.page}>
      <Navbar variant="public" />
      <header style={s.hero}>
        <div style={s.heroGrid}>
          <div>
            <p style={s.eyebrow}>Task Management Reimagined</p>
            <h1 style={s.title}>Work together, ship faster</h1>
            <p style={s.subtitle}>CollabBoard combines real-time collaboration, task workflows, and role-based access controls to help teams plan, prioritize, and deliver.</p>
            <div style={s.actions}>
              <button style={s.btnPrimary} onClick={() => navigate("/register")}>Get Started — it's free</button>
              <button style={s.btnGhost} onClick={() => navigate("/login")}>Sign In</button>
            </div>
          </div>
          <div>
            <div style={s.panel}>
              <div style={s.panelDots}>
                <span style={{ ...s.dot, background: "#3b82f6" }} />
                <span style={{ ...s.dot, background: "#8b5cf6" }} />
                <span style={{ ...s.dot, background: "#ec4899" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div><p style={{ margin: "0 0 3px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.65rem" }}>Sprint board</p><h3 style={{ margin: 0, fontSize: "1rem" }}>Launch website</h3></div>
                <span style={{ padding: "3px 9px", borderRadius: 999, fontSize: "0.65rem", fontWeight: 700, background: "#dc2626", color: "white" }}>High</span>
              </div>
              <div style={s.panelCard}><p style={{ margin: 0 }}>Review copy and brand assets.</p><div style={s.panelMeta}><span>Assigned to Maya</span><span>Due Fri</span></div></div>
              <div style={s.panelCard}><p style={{ margin: 0 }}>Finalize onboarding flow.</p><div style={s.panelMeta}><span>Assigned to Omar</span><span>Due Mon</span></div></div>
              <div style={s.panelCard}><p style={{ margin: 0 }}>QA mobile responsiveness.</p><div style={s.panelMeta}><span>Assigned to Ava</span><span>Due Tue</span></div></div>
            </div>
          </div>
        </div>
      </header>

      <section style={s.section}>
        <p style={s.eyebrow}>Built for teams</p>
        <h2 style={s.sectionTitle}>A polished workspace for every project.</h2>
        <p style={{ maxWidth: 540, color: "#64748b", lineHeight: 1.7 }}>From sprints to product launches, CollabBoard keeps the right people on the right tasks.</p>
        <div style={s.featureGrid}>
          <div style={{ ...s.featureCard, ...s.featureCardHighlight }}><h3 style={{ margin: "0 0 10px", fontSize: "1.05rem" }}>Modern board experience</h3><p style={{ margin: 0, color: "rgba(255,255,255,0.8)", fontSize: "0.88rem", lineHeight: 1.6 }}>Drag-and-drop columns, instant status changes, real-time sync.</p></div>
          <div style={s.featureCard}><h3 style={{ margin: "0 0 10px", fontSize: "1.05rem" }}>Smart role controls</h3><p style={{ margin: 0, color: "#94a3b8", fontSize: "0.88rem", lineHeight: 1.6 }}>Admins manage boards and users. Members focus on their tasks.</p></div>
          <div style={s.featureCard}><h3 style={{ margin: "0 0 10px", fontSize: "1.05rem" }}>Actionable task details</h3><p style={{ margin: 0, color: "#94a3b8", fontSize: "0.88rem", lineHeight: 1.6 }}>Assignees, due dates, priority tags, all from one card view.</p></div>
        </div>
      </section>

      <section style={s.whySection}>
        <div style={s.whyInner}>
          <div style={{ textAlign: "center" }}>
            <p style={s.eyebrow}>Why CollabBoard</p>
            <h2 style={{ ...s.sectionTitle, textAlign: "center" }}>Everything your team needs</h2>
          </div>
          <div style={s.whyGrid}>
            <div style={s.whyCard}><div style={{ fontSize: "1.8rem", marginBottom: 10 }}>⚡</div><h3 style={{ margin: "0 0 6px", fontSize: "0.95rem", fontWeight: 700 }}>Real-Time Sync</h3><p style={{ margin: 0, color: "#64748b", fontSize: "0.82rem" }}>See changes instantly, no refresh.</p></div>
            <div style={s.whyCard}><div style={{ fontSize: "1.8rem", marginBottom: 10 }}>🔒</div><h3 style={{ margin: "0 0 6px", fontSize: "0.95rem", fontWeight: 700 }}>Role-Based Access</h3><p style={{ margin: 0, color: "#64748b", fontSize: "0.82rem" }}>Admins manage users; members manage cards.</p></div>
            <div style={s.whyCard}><div style={{ fontSize: "1.8rem", marginBottom: 10 }}>💬</div><h3 style={{ margin: "0 0 6px", fontSize: "0.95rem", fontWeight: 700 }}>Team Chat</h3><p style={{ margin: 0, color: "#64748b", fontSize: "0.82rem" }}>Built-in messaging per team.</p></div>
            <div style={s.whyCard}><div style={{ fontSize: "1.8rem", marginBottom: 10 }}>📋</div><h3 style={{ margin: "0 0 6px", fontSize: "0.95rem", fontWeight: 700 }}>Kanban Boards</h3><p style={{ margin: 0, color: "#64748b", fontSize: "0.82rem" }}>To Do, In Progress, Done columns.</p></div>
            <div style={s.whyCard}><div style={{ fontSize: "1.8rem", marginBottom: 10 }}>👥</div><h3 style={{ margin: "0 0 6px", fontSize: "0.95rem", fontWeight: 700 }}>Team Management</h3><p style={{ margin: 0, color: "#64748b", fontSize: "0.82rem" }}>Create teams, auto-assign tasks.</p></div>
            <div style={s.whyCard}><div style={{ fontSize: "1.8rem", marginBottom: 10 }}>🎯</div><h3 style={{ margin: "0 0 6px", fontSize: "0.95rem", fontWeight: 700 }}>Priority Tags</h3><p style={{ margin: 0, color: "#64748b", fontSize: "0.82rem" }}>High, Medium, Low — always clear.</p></div>
          </div>
        </div>
      </section>

      <footer style={s.footer}><p style={{ margin: 0 }}>© 2026 CollabBoard — built for teams that ship work together.</p></footer>
    </div>
  );
}

export default Home;
