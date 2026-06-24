import React, { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const s = {
  card: { background: "#fff", borderRadius: 14, padding: 24, border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
  title: { margin: "0 0 14px", fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" },
  list: { display: "flex", flexDirection: "column" },
  item: { display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", borderBottom: "1px solid #f3f4f6" },
  icon: { width: 30, height: 30, borderRadius: 7, display: "grid", placeItems: "center", fontSize: "0.8rem", background: "#dbeafe", flexShrink: 0 },
  name: { fontSize: "0.82rem", fontWeight: 600, color: "#0f172a", display: "block" },
  meta: { fontSize: "0.72rem", color: "#94a3b8" },
};

function RecentActivity() {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "boards"), orderBy("createdAt", "desc"), limit(5));
    const unsub = onSnapshot(q, (snap) => {
      setActivities(snap.docs.map((d) => {
        const data = d.data();
        return { id: d.id, title: `Board "${data.name}" created`, by: data.createdByEmail || "Unknown", time: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString() : "Recently" };
      }));
    });
    return () => unsub();
  }, []);

  return (
    <div style={s.card}>
      <h3 style={s.title}>Recent Activity</h3>
      {activities.length === 0 ? (
        <p style={{ margin: 0, color: "#64748b", fontSize: "0.85rem" }}>No activity yet.</p>
      ) : (
        <div style={s.list}>
          {activities.map((a) => (
            <div key={a.id} style={s.item}>
              <div style={s.icon}>📋</div>
              <div><strong style={s.name}>{a.title}</strong><span style={s.meta}>{a.by} · {a.time}</span></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RecentActivity;
