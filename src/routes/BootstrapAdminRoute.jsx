import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useAuth } from "../context/AuthContext";

function BootstrapAdminRoute({ children }) {
  const { currentUser, role, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [hasAdmin, setHasAdmin] = useState(false);

  useEffect(() => {
    if (!db) {
      setChecking(false);
      return;
    }

    async function checkAdmins() {
      try {
        const adminQuery = query(
          collection(db, "users"),
          where("role", "==", "admin"),
          limit(1)
        );
        const snap = await getDocs(adminQuery);
        setHasAdmin(!snap.empty);
      } catch {
        setHasAdmin(true);
      } finally {
        setChecking(false);
      }
    }

    checkAdmins();
  }, []);

  if (authLoading || checking) {
    return <div className="center-content" style={{ minHeight: "70vh" }}>Loading...</div>;
  }

  if (hasAdmin) {
    if (!currentUser) {
      return <Navigate to="/login" replace />;
    }
    if (role !== "admin") {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}

export default BootstrapAdminRoute;
