import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot, collection, addDoc, query, orderBy, serverTimestamp, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useAuth } from "../context/AuthContext";
import AuthenticatedLayout from "../components/AuthenticatedLayout";
import BoardColumn from "../components/BoardColumn";
import TaskCard from "../components/TaskCard";
import TaskEditModal from "../components/TaskEditModal";

const STATUSES = ["To Do", "In Progress", "Done"];

function Board() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, role, loading } = useAuth();
  const [board, setBoard] = useState(null);
  const [boardLoading, setBoardLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: "", description: "", assignee: "", dueDate: "", priority: "Medium", status: "To Do" });
  const [editingTask, setEditingTask] = useState(null);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingBoard, setEditingBoard] = useState(false);
  const [editBoardName, setEditBoardName] = useState("");
  const [editBoardDesc, setEditBoardDesc] = useState("");

  useEffect(() => {
    if (!db || !id) return;
    setBoardLoading(true);
    const boardRef = doc(db, "boards", id);
    const taskQuery = query(collection(boardRef, "tasks"), orderBy("createdAt", "asc"));
    const unsubBoard = onSnapshot(boardRef, (snapshot) => {
      setBoard({ id: snapshot.id, ...snapshot.data() });
      setBoardLoading(false);
    });
    const unsubTasks = onSnapshot(taskQuery, (snapshot) => {
      setTasks(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubBoard(); unsubTasks(); };
  }, [id]);

  const tasksByStatus = useMemo(() => {
    const grouped = { "To Do": [], "In Progress": [], Done: [] };
    tasks.forEach((task) => { grouped[task.status || "To Do"].push(task); });
    return grouped;
  }, [tasks]);

  const canEditTask = (task) => {
    if (!currentUser) return false;
    return role === "admin" || task.assignee === currentUser.email || task.createdBy === currentUser.uid;
  };

  const isTaskAssignee = (task) => {
    if (!currentUser) return false;
    return task.assignee === currentUser.email;
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError(null);
    if (!newTask.title.trim()) { setError("Task title is required."); return; }
    if (!db || !currentUser) return;
    const boardRef = doc(db, "boards", id);
    await addDoc(collection(boardRef, "tasks"), {
      ...newTask, createdAt: serverTimestamp(),
      createdBy: currentUser.uid, createdByEmail: currentUser.email,
    });
    setNewTask({ title: "", description: "", assignee: "", dueDate: "", priority: "Medium", status: "To Do" });
    setShowForm(false);
  };

  const handleStatusDrop = async (taskId, newStatus) => {
    if (!db) return;
    await updateDoc(doc(db, "boards", id, "tasks", taskId), { status: newStatus });
  };

  const handleSaveTask = async (form) => {
    if (!db || !editingTask) return;
    await updateDoc(doc(db, "boards", id, "tasks", editingTask.id), {
      ...form,
      progress: form.progress || "Accepted",
    });
    setEditingTask(null);
  };

  const handleUpdateProgress = async (task, newProgress) => {
    if (!db) return;
    let newStatus = task.status;
    if (newProgress === "Accepted") {
      newStatus = "To Do";
    } else if (newProgress === "Working" || newProgress === "In Review") {
      newStatus = "In Progress";
    } else if (newProgress === "Completed") {
      newStatus = "Done";
    }
    await updateDoc(doc(db, "boards", id, "tasks", task.id), {
      progress: newProgress,
      status: newStatus,
    });
  };

  const handleDeleteTask = async (task) => {
    if (!window.confirm("Delete this task?")) return;
    if (!db) return;
    await deleteDoc(doc(db, "boards", id, "tasks", task.id));
  };

  const startEditBoard = () => {
    setEditBoardName(board?.name || "");
    setEditBoardDesc(board?.description || "");
    setEditingBoard(true);
  };

  const handleSaveBoard = async (e) => {
    e.preventDefault();
    if (!db || !id) return;
    if (!editBoardName.trim()) return;
    await updateDoc(doc(db, "boards", id), {
      name: editBoardName.trim(),
      description: editBoardDesc.trim(),
    });
    setEditingBoard(false);
  };

  if (loading || boardLoading) return (
    <AuthenticatedLayout>
      <div className="loading-skeleton">
        <div className="loading-spinner" />
        <span className="loading-text">Loading board...</span>
      </div>
    </AuthenticatedLayout>
  );

  return (
    <AuthenticatedLayout>
      <div className="team-board-page">
        {/* Header */}
        <div className="team-board-header">
          <div className="team-board-header-left">
            <button className="button-link" onClick={() => navigate("/dashboard")} style={{ fontSize: "0.825rem" }}>
              ← Back to Dashboard
            </button>
            {editingBoard ? (
              <form onSubmit={handleSaveBoard} style={{ display: "grid", gap: 10, marginTop: 8 }}>
                <input
                  className="form-input"
                  value={editBoardName}
                  onChange={(e) => setEditBoardName(e.target.value)}
                  placeholder="Board name"
                  style={{ fontSize: "1.1rem", fontWeight: 700 }}
                />
                <input
                  className="form-input"
                  value={editBoardDesc}
                  onChange={(e) => setEditBoardDesc(e.target.value)}
                  placeholder="Board description"
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="submit" className="button-primary" style={{ padding: "8px 14px", fontSize: "0.8rem" }}>Save</button>
                  <button type="button" className="button-secondary" style={{ padding: "8px 14px", fontSize: "0.8rem" }} onClick={() => setEditingBoard(false)}>Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <h1 className="team-board-title">{board?.name || "Board"}</h1>
                  {role === "admin" && (
                    <button
                      className="button-secondary"
                      style={{ padding: "6px 12px", fontSize: "0.75rem" }}
                      onClick={startEditBoard}
                    >
                      Edit
                    </button>
                  )}
                </div>
                <div className="team-board-meta">
                  <span className="team-board-badge">{tasks.length} tasks</span>
                  <span className="team-board-badge">by {board?.createdByEmail || "unknown"}</span>
                </div>
                {board?.description && (
                  <p className="text-muted" style={{ margin: "4px 0 0", fontSize: "0.9rem" }}>
                    {board.description}
                  </p>
                )}
              </>
            )}
          </div>
          <button className="button-primary" onClick={() => setShowForm(!showForm)} style={{ display: role === "admin" ? "inline-flex" : "none" }}>
            {showForm ? "Close" : "+ Add Task"}
          </button>
        </div>

        {/* Create Task Form */}
        {showForm && (
          <div className="team-board-form-panel">
            <h3 style={{ margin: "0 0 16px", fontSize: "1rem", fontWeight: 700 }}>New Task</h3>
            <form onSubmit={handleCreateTask} className="team-board-form">
              <div className="team-board-form-row">
                <div className="form-field" style={{ flex: 2 }}>
                  <label>Title</label>
                  <input className="form-input" value={newTask.title} onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))} placeholder="Task title" />
                </div>
                <div className="form-field" style={{ flex: 1 }}>
                  <label>Priority</label>
                  <select className="form-select" value={newTask.priority} onChange={(e) => setNewTask((p) => ({ ...p, priority: e.target.value }))}>
                    <option>High</option><option>Medium</option><option>Low</option>
                  </select>
                </div>
                <div className="form-field" style={{ flex: 1 }}>
                  <label>Due Date</label>
                  <input className="form-input" type="date" value={newTask.dueDate} onChange={(e) => setNewTask((p) => ({ ...p, dueDate: e.target.value }))} />
                </div>
              </div>

              <div className="team-board-form-row">
                <div className="form-field" style={{ flex: 2 }}>
                  <label>Description</label>
                  <textarea className="form-textarea" value={newTask.description} onChange={(e) => setNewTask((p) => ({ ...p, description: e.target.value }))} placeholder="Optional description" rows={2} />
                </div>
                <div className="form-field" style={{ flex: 1 }}>
                  <label>Assignee Email</label>
                  <input className="form-input" value={newTask.assignee} onChange={(e) => setNewTask((p) => ({ ...p, assignee: e.target.value }))} placeholder="user@email.com" />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" className="button-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="button-primary">Create Task</button>
              </div>
              {error && <p className="error-text">{error}</p>}
            </form>
          </div>
        )}

        {/* Kanban Board */}
        <div className="board-columns">
          {STATUSES.map((status) => (
            <BoardColumn
              key={status}
              title={`${status} (${tasksByStatus[status].length})`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const taskId = e.dataTransfer.getData("taskId");
                if (taskId) handleStatusDrop(taskId, status);
              }}
            >
              {tasksByStatus[status].map((task) => (
                <div key={task.id} draggable onDragStart={(e) => e.dataTransfer.setData("taskId", task.id)}>
                  <TaskCard
                    task={task}
                    isAssignee={isTaskAssignee(task)}
                    isAdmin={role === "admin"}
                    onEdit={() => setEditingTask(task)}
                    onDelete={() => handleDeleteTask(task)}
                    onUpdateProgress={isTaskAssignee(task) ? handleUpdateProgress : null}
                  />
                </div>
              ))}
            </BoardColumn>
          ))}
        </div>
      </div>

      <TaskEditModal task={editingTask} onSave={handleSaveTask} onClose={() => setEditingTask(null)} />
    </AuthenticatedLayout>
  );
}

export default Board;
