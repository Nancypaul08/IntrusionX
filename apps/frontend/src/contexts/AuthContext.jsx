import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api, { setApiToken } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("intrusionx-token"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("intrusionx-user");
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    setApiToken(token);
  }, [token]);

  async function login(email, password) {
    const response = await api.post("/auth/login", { email, password });
    setToken(response.data.token);
    setUser(response.data.user);
    localStorage.setItem("intrusionx-token", response.data.token);
    localStorage.setItem("intrusionx-user", JSON.stringify(response.data.user));
    setApiToken(response.data.token);
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem("intrusionx-token");
    localStorage.removeItem("intrusionx-user");
    setApiToken(null);
  }

  const value = useMemo(
    () => ({
      token,
      user,
      login,
      logout
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
