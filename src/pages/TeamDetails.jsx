import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { collection, doc, onSnapshot, addDoc, query, orderBy, serverTimestamp, updateDoc, deleteDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useAuth } from "../context/AuthContext";
import AuthenticatedLayout from "../components/AuthenticatedLayout";
import BoardColumn from "../components/BoardColumn";
import TaskCard from "../components/TaskCard";
import TaskEditModal from "../components/TaskEditModal";

const STATUSES = ["To Do", "In Progress", "Done"];

function TeamDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userData, role, loading } = useAuth();
  const [team, setTeam] = useState(null);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [newTask, setNewTask] = useState({ title: "", description: "", assigneeEmpId: "", role: "", dueDate: "", priority: "Medium", status: "To Do" });
  const [assignMode, setAssignMode] = useState("manual");
  const [selectedRole, setSelectedRole] = useState("");
  const [error, setError] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showManageMembers, setShowManageMembers] = useState(false);
  const [editingTeamName, setEditingTeamName] = useState(false);
  const [teamNameEdit, setTeamNameEdit] = useState("");

  const teamMembers = users.filter((user) => team?.members?.includes(user.id));
  const teamRoles = Array.from(new Set(teamMembers.map((member) => member.jobRole).filter(Boolean)));

  useEffect(() => {
    if (!teamRoles.length) return;
    if (!selectedRole) setSelectedRole(teamRoles[0]);
  }, [teamRoles, selectedRole]);

  useEffect(() => {
    if (!db || !id) return;
    setTeamLoading(true);
    const teamRef = doc(db, "teams", id);
    const unsubscribeTeam = onSnapshot(teamRef, (snapshot) => {
      if (!snapshot.exists()) { setTeam(null); }
      else { setTeam({ id: snapshot.id, ...snapshot.data() }); }
      setTeamLoading(false);
    });
    const tasksQuery = query(collection(teamRef, "tasks"), orderBy("createdAt", "asc"));
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      setTasks(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubscribeTeam(); unsubscribeTasks(); };
  }, [id]);

  useEffect(() => {
    async function loadUsers() {
      if (!db) return;
      const usersSnap = await getDocs(collection(db, "users"));
      setUsers(usersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    }
    loadUsers();
  }, []);

  const tasksByStatus = useMemo(() => {
    const grouped = { "To Do": [], "In Progress": [], Done: [] };
    tasks.forEach((task) => { grouped[task.status || "To Do"].push(task); });
    return grouped;
  }, [tasks]);

  const isTaskAssignee = (task) => {
    if (!currentUser) return false;
    // Support comma-separated empIds for group tasks
    const assigneeIds = (task.assigneeEmpId || "").split(",").map((id) => id.trim());
    return (
      assigneeIds.includes(userData?.empId) ||
      task.assignee === currentUser.email
    );
  };

  // Autocomplete suggestions for empId input
  const empIdSuggestions = useMemo(() => {
    const q = (newTask.assigneeEmpId || "").toLowerCase().trim();
    if (!q) return teamMembers;
    return teamMembers.filter(
      (m) =>
        m.empId?.toLowerCase().includes(q) ||
        m.fullName?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q)
    );
  }, [newTask.assigneeEmpId, teamMembers]);

  const selectSuggestion = (member) => {
    setNewTask((p) => ({ ...p, assigneeEmpId: member.empId || "" }));
    setShowSuggestions(false);
  };

  const getMembersByRole = (roleName) => teamMembers.filter((m) => m.jobRole === roleName);

  // Check if a member is busy (has an active task not yet completed)
  const isMemberBusy = (empId) => {
    return tasks.some((t) => t.assigneeEmpId === empId && t.status !== "Done" && t.progress !== "Completed");
  };

  const findAutoAssigneeEmpId = (roleName) => {
    const roleMembers = getMembersByRole(roleName);
    if (!roleMembers.length) return null;

    // Check if all members of this role are busy
    const allBusy = roleMembers.every((m) => isMemberBusy(m.empId));

    if (allBusy) {
      // Assign to ALL members of this role (collaborative task)
      return roleMembers.map((m) => m.empId).join(",");
    }

    // Otherwise find the least-loaded free member
    const existingTasksForRole = tasks.filter((task) => task.role === roleName);
    const assignmentCounts = roleMembers.reduce((acc, member) => { acc[member.empId] = 0; return acc; }, {});
    existingTasksForRole.forEach((task) => {
      if (task.assigneeEmpId && assignmentCounts[task.assigneeEmpId] !== undefined) {
        assignmentCounts[task.assigneeEmpId] += 1;
      }
    });
    let selectedMember = roleMembers[0];
    let lowestCount = assignmentCounts[selectedMember.empId];
    roleMembers.forEach((member) => {
      const count = assignmentCounts[member.empId] ?? 0;
      if (count < lowestCount) { lowestCount = count; selectedMember = member; }
    });
    return selectedMember.empId;
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError(null);
    if (!newTask.title.trim()) { setError("Task title is required."); return; }
    if (!db || !currentUser) return;
    const taskRole = assignMode === "auto" ? selectedRole : newTask.role?.trim();
    if (!taskRole) { setError("Select a role for this task."); return; }
    const teamRef = doc(db, "teams", id);
    const taskPayload = {
      title: newTask.title.trim(), description: newTask.description.trim(),
      dueDate: newTask.dueDate, priority: newTask.priority, status: newTask.status,
      createdAt: serverTimestamp(), createdBy: currentUser.uid,
      createdByEmail: currentUser.email, teamId: id, role: taskRole,
    };
    if (assignMode === "auto") {
      const assignedEmpId = findAutoAssigneeEmpId(selectedRole);
      if (!assignedEmpId) { setError("No eligible members found."); return; }
      taskPayload.assigneeEmpId = assignedEmpId;
    } else {
      if (newTask.assigneeEmpId) taskPayload.assigneeEmpId = newTask.assigneeEmpId.trim();
    }
    await addDoc(collection(teamRef, "tasks"), taskPayload);
    setNewTask({ title: "", description: "", assigneeEmpId: "", role: "", dueDate: "", priority: "Medium", status: "To Do" });
    setShowForm(false);
  };

  const handleStatusDrop = async (taskId, newStatus) => {
    if (!db) return;
    await updateDoc(doc(db, "teams", id, "tasks", taskId), { status: newStatus });
  };

  const handleSaveTask = async (form) => {
    if (!db || !editingTask) return;
    await updateDoc(doc(db, "teams", id, "tasks", editingTask.id), {
      title: form.title, description: form.description,
      assigneeEmpId: form.assignee, dueDate: form.dueDate,
      priority: form.priority, status: form.status,
      progress: form.progress || "Accepted",
    });
    setEditingTask(null);
  };

  const handleDeleteTask = async (task) => {
    if (!window.confirm("Delete this task?")) return;
    if (!db) return;
    await deleteDoc(doc(db, "teams", id, "tasks", task.id));
  };

  const handleUpdateProgress = async (task, newProgress) => {
    if (!db) return;
    // Auto-move column based on progress step
    let newStatus = task.status;
    if (newProgress === "Accepted") {
      newStatus = "To Do";
    } else if (newProgress === "Working" || newProgress === "In Review") {
      newStatus = "In Progress";
    } else if (newProgress === "Completed") {
      newStatus = "Done";
    }
    await updateDoc(doc(db, "teams", id, "tasks", task.id), {
      progress: newProgress,
      status: newStatus,
    });
  };

  const handleSaveTeamName = async (e) => {
    e.preventDefault();
    if (!db || !id || !teamNameEdit.trim()) return;
    await updateDoc(doc(db, "teams", id), { name: teamNameEdit.trim() });
    setEditingTeamName(false);
  };

  const handleRemoveMember = async (memberId) => {
    if (!db || !id || !team) return;
    if (!window.confirm("Remove this member from the team?")) return;
    const updatedMembers = (team.members || []).filter((m) => m !== memberId);
    await updateDoc(doc(db, "teams", id), { members: updatedMembers });
  };

  const handleAddMember = async (userId) => {
    if (!db || !id || !team) return;
    if (team.members?.includes(userId)) return;
    const updatedMembers = [...(team.members || []), userId];
    await updateDoc(doc(db, "teams", id), { members: updatedMembers });
  };

  const nonTeamMembers = users.filter((u) => !team?.members?.includes(u.id));

  if (loading || teamLoading) return (
    <AuthenticatedLayout>
      <div className="loading-skeleton">
        <div className="loading-spinner" />
        <span className="loading-text">Loading team...</span>
      </div>
    </AuthenticatedLayout>
  );

  if (!team) return (
    <AuthenticatedLayout>
      <div className="card empty-state">
        <h2>Team not found</h2>
        <p className="text-muted">This team may have been deleted.</p>
        <button className="button-secondary" onClick={() => navigate("/teams")}>Back to Teams</button>
      </div>
    </AuthenticatedLayout>
  );

  return (
    <AuthenticatedLayout>
      <div className="team-board-page">
        {/* Header */}
        <div className="team-board-header">
          <div className="team-board-header-left">
            <button className="button-link" onClick={() => navigate("/teams")} style={{ fontSize: "0.825rem" }}>
              ← Back to Teams
            </button>
            {editingTeamName ? (
              <form onSubmit={handleSaveTeamName} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                <input
                  className="form-input"
                  value={teamNameEdit}
                  onChange={(e) => setTeamNameEdit(e.target.value)}
                  style={{ fontSize: "1.1rem", fontWeight: 700, width: 240 }}
                />
                <button type="submit" className="button-primary" style={{ padding: "8px 14px", fontSize: "0.8rem" }}>Save</button>
                <button type="button" className="button-secondary" style={{ padding: "8px 14px", fontSize: "0.8rem" }} onClick={() => setEditingTeamName(false)}>Cancel</button>
              </form>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <h1 className="team-board-title">{team.name}</h1>
                {role === "admin" && (
                  <button className="button-secondary" style={{ padding: "6px 12px", fontSize: "0.75rem" }} onClick={() => { setTeamNameEdit(team.name); setEditingTeamName(true); }}>
                    Rename
                  </button>
                )}
              </div>
            )}
            <div className="team-board-meta">
              <span className="team-board-badge">{team.members?.length || 0} members</span>
              <span className="team-board-badge">{tasks.length} tasks</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {role === "admin" && (
              <button className="button-secondary" onClick={() => setShowManageMembers(!showManageMembers)}>
                {showManageMembers ? "Close Members" : "Manage Members"}
              </button>
            )}
            {role === "admin" && (
              <button className="button-primary" onClick={() => setShowForm(!showForm)}>
                {showForm ? "Close" : "+ Add Task"}
              </button>
            )}
          </div>
        </div>

        {/* Manage Members Panel */}
        {showManageMembers && (
          <div className="team-board-form-panel">
            <h3 style={{ margin: "0 0 16px", fontSize: "1rem", fontWeight: 700 }}>Team Members</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {/* Current Members */}
              <div>
                <h4 style={{ margin: "0 0 10px", fontSize: "0.875rem", color: "#334155" }}>
                  Current Members ({teamMembers.length})
                </h4>
                <div className="teams-member-list" style={{ maxHeight: 200 }}>
                  {teamMembers.length === 0 ? (
                    <p className="text-muted" style={{ fontSize: "0.825rem" }}>No members in this team.</p>
                  ) : (
                    teamMembers.map((member) => (
                      <div key={member.id} className="manage-member-row">
                        <div className="manage-member-info">
                          <span className="manage-member-name">{member.fullName || member.email}</span>
                          <span className="manage-member-meta">{member.empId || "—"} · {member.jobRole || "No role"}</span>
                        </div>
                        <button
                          className="button-danger"
                          style={{ padding: "5px 10px", fontSize: "0.7rem" }}
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add Members */}
              <div>
                <h4 style={{ margin: "0 0 10px", fontSize: "0.875rem", color: "#334155" }}>
                  Add Members ({nonTeamMembers.length} available)
                </h4>
                <div className="teams-member-list" style={{ maxHeight: 200 }}>
                  {nonTeamMembers.length === 0 ? (
                    <p className="text-muted" style={{ fontSize: "0.825rem" }}>All users are in this team.</p>
                  ) : (
                    nonTeamMembers.map((user) => (
                      <div key={user.id} className="manage-member-row">
                        <div className="manage-member-info">
                          <span className="manage-member-name">{user.fullName || user.email}</span>
                          <span className="manage-member-meta">{user.empId || "—"} · {user.jobRole || "No role"}</span>
                        </div>
                        <button
                          className="button-primary"
                          style={{ padding: "5px 10px", fontSize: "0.7rem" }}
                          onClick={() => handleAddMember(user.id)}
                        >
                          Add
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

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

              <div className="form-field">
                <label>Description</label>
                <textarea className="form-textarea" value={newTask.description} onChange={(e) => setNewTask((p) => ({ ...p, description: e.target.value }))} placeholder="Optional description" rows={2} />
              </div>

              <div className="team-board-form-row">
                <div className="form-field" style={{ flex: 1 }}>
                  <label>Assignment</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" className={assignMode === "manual" ? "button-primary" : "button-secondary"} style={{ padding: "8px 14px", fontSize: "0.8rem" }} onClick={() => setAssignMode("manual")}>Manual</button>
                    <button type="button" className={assignMode === "auto" ? "button-primary" : "button-secondary"} style={{ padding: "8px 14px", fontSize: "0.8rem" }} onClick={() => setAssignMode("auto")}>Auto</button>
                  </div>
                </div>
                {assignMode === "manual" ? (
                  <>
                    <div className="form-field" style={{ flex: 1, position: "relative" }}>
                      <label>Assignee Emp ID</label>
                      <input
                        className="form-input"
                        value={newTask.assigneeEmpId}
                        onChange={(e) => {
                          setNewTask((p) => ({ ...p, assigneeEmpId: e.target.value }));
                          setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        placeholder="Type to search..."
                        autoComplete="off"
                      />
                      {showSuggestions && empIdSuggestions.length > 0 && (
                        <div className="autocomplete-dropdown">
                          {empIdSuggestions.slice(0, 6).map((member) => (
                            <button
                              key={member.id}
                              type="button"
                              className="autocomplete-item"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => selectSuggestion(member)}
                            >
                              <div className="autocomplete-item-main">
                                <span className="autocomplete-name">{member.fullName || "Unknown"}</span>
                                <span className="autocomplete-email">{member.email}</span>
                              </div>
                              <span className="autocomplete-empid">{member.empId || "—"}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="form-field" style={{ flex: 1 }}>
                      <label>Job Role</label>
                      {teamRoles.length > 0 ? (
                        <select className="form-select" value={newTask.role} onChange={(e) => setNewTask((p) => ({ ...p, role: e.target.value }))}>
                          <option value="">Select role</option>
                          {teamRoles.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      ) : (
                        <input className="form-input" value={newTask.role} onChange={(e) => setNewTask((p) => ({ ...p, role: e.target.value }))} placeholder="frontend" />
                      )}
                    </div>
                  </>
                ) : (
                  <div className="form-field" style={{ flex: 2 }}>
                    <label>Auto-assign to role</label>
                    {teamRoles.length > 0 ? (
                      <select className="form-select" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                        {teamRoles.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    ) : (
                      <p className="text-muted" style={{ margin: 0, fontSize: "0.825rem" }}>No roles found in team members.</p>
                    )}
                  </div>
                )}
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
            <BoardColumn key={status} title={`${status} (${tasksByStatus[status].length})`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
              const taskId = e.dataTransfer.getData("taskId");
              if (taskId) handleStatusDrop(taskId, status);
            }}>
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

      <TaskEditModal task={editingTask} assigneeLabel="Assignee employee ID" onSave={handleSaveTask} onClose={() => setEditingTask(null)} />
    </AuthenticatedLayout>
  );
}

export default TeamDetails;
