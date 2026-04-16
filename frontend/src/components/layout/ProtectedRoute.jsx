import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "var(--text-soft)" }}>
        Loading…
      </div>
    );
  }

  return children;
}
