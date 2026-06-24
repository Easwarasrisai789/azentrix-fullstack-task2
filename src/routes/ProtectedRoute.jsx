import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, requireAdmin = false }) {
  const { currentUser, userData, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 14 }}>
        <div style={{ width: 36, height: 36, border: "3px solid #e5e7eb", borderTopColor: "#4f46e5", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span style={{ color: "#64748b", fontSize: "0.88rem" }}>Loading...</span>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Check if profile is complete (has fullName, empId, jobRole)
  // Allow access to /profile so they can complete it
  const isProfileComplete = userData?.fullName && userData?.empId && userData?.jobRole;
  const isOnProfilePage = location.pathname === "/profile";

  if (!isProfileComplete && !isOnProfilePage) {
    return <Navigate to="/profile" replace />;
  }

  if (requireAdmin && role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
