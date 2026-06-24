import React from "react";
import Sidebar from "./Sidebar";

const styles = {
  page: {
    display: "flex",
    alignItems: "flex-start",
    minHeight: "100vh",
    background: "#f7f8fa",
  },
  content: {
    flex: 1,
    padding: "32px 40px",
    maxWidth: 1240,
    minHeight: "100vh",
  },
};

function AuthenticatedLayout({ children }) {
  return (
    <div style={styles.page}>
      <Sidebar />
      <main style={styles.content}>{children}</main>
    </div>
  );
}

export default AuthenticatedLayout;
