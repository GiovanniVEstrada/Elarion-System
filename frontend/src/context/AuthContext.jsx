import { createContext, useContext, useEffect, useState } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem("token")));

  // On mount: verify stored token is still valid
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
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

  async function updateUser(name) {
    const res = await client.patch("/auth/me", { name });
    const updated = res.data?.data ?? res.data;
    setUser((prev) => ({ ...prev, ...updated }));
  }

  async function patchMe(fields) {
    const res = await client.patch("/auth/me", fields);
    const updated = res.data?.data ?? res.data;
    setUser((prev) => ({ ...prev, ...updated }));
    return updated;
  }

  async function deleteAccount() {
    await client.delete("/auth/me");
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    window.location.href = "/register";
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
        updateUser,
        patchMe,
        deleteAccount,
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
