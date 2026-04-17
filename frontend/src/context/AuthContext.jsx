import { createContext, useContext, useEffect, useState } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // On mount: verify stored token is still valid
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      setLoading(false);
      return;
    }
    client
      .get("/auth/me")
      .then((res) => {
        // Support { success, data } shape and legacy flat shape
        const payload = res.data?.data ?? res.data;
        setUser(payload);
      })
      .catch(() => {
        localStorage.removeItem("token");
        setToken(null);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function saveToken(newToken) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }

  async function register(name, email, password) {
    const res = await client.post("/auth/register", { name, email, password });
    // Support { success, data: { token, ...user } } shape
    const payload = res.data?.data ?? res.data;
    const { token: newToken, ...userData } = payload;
    saveToken(newToken);
    setUser(userData);
  }

  async function login(email, password) {
    const res = await client.post("/auth/login", { email, password });
    // Support { success, data: { token, ...user } } shape
    const payload = res.data?.data ?? res.data;
    const { token: newToken, ...userData } = payload;
    saveToken(newToken);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    window.location.href = "/login";
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
