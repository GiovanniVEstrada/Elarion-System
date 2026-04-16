import { createContext, useContext, useEffect, useState } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // On mount: verify stored token is still valid
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    client
      .get("/auth/me")
      .then((res) => setUser(res.data.user ?? res.data))
      .catch(() => {
        localStorage.removeItem("token");
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  function saveToken(newToken) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }

  async function register(name, email, password) {
    const res = await client.post("/auth/register", { name, email, password });
    const { token, ...userData } = res.data;
    saveToken(token);
    setUser(userData);
  }

  async function login(email, password) {
    const res = await client.post("/auth/login", { email, password });
    const { token, ...userData } = res.data;
    saveToken(token);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isGuest: !loading && !user,
        loading,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
