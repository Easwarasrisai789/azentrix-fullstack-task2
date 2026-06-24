import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, setPersistence, browserSessionPersistence } from "firebase/auth";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";

const AuthContext = createContext({
  currentUser: null,
  userData: null,
  role: null,
  loading: true,
  signOutUser: async () => {},
});

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    // Set session persistence — user is logged out when browser/tab closes
    setPersistence(auth, browserSessionPersistence).catch(() => {});

    let userUnsub = null;

    const authUnsub = onAuthStateChanged(auth, (user) => {
      if (userUnsub) {
        userUnsub();
        userUnsub = null;
      }

      if (!user) {
        setCurrentUser(null);
        setUserData(null);
        setRole(null);
        setLoading(false);
        return;
      }

      setCurrentUser(user);
      setLoading(true);

      userUnsub = onSnapshot(
        doc(db, "users", user.uid),
        (userDoc) => {
          setUserData(userDoc.exists() ? userDoc.data() : null);
          setRole(userDoc.exists() ? userDoc.data().role : "member");
          setLoading(false);
        },
        () => {
          setUserData(null);
          setRole("member");
          setLoading(false);
        }
      );
    });

    return () => {
      authUnsub();
      if (userUnsub) userUnsub();
    };
  }, []);

  const signOutUser = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ currentUser, userData, role, loading, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
