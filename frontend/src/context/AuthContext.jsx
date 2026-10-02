import { useEffect, useState } from "react";
import { AuthContext } from "./auth-context";
import { apiRequest } from "../services/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser =
      sessionStorage.getItem("user") || localStorage.getItem("user");

    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      sessionStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      sessionStorage.removeItem("user");
      localStorage.removeItem("user");
    }
  }, [user]);

  const login = async (email, password) => {
    setLoading(true);

    try {
      const data = await apiRequest("/users/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (data?.token) {
        sessionStorage.setItem("token", data.token);
        localStorage.setItem("token", data.token);
      }
      setUser(data.user);

      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);

    try {
      await apiRequest("/users/register", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      // Registration does not create the auth cookie,
      // so log the user in immediately after registration.
      const loginData = await apiRequest("/users/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (loginData?.token) {
        sessionStorage.setItem("token", loginData.token);
        localStorage.setItem("token", loginData.token);
      }
      setUser(loginData.user);

      return loginData;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);

    try {
      await apiRequest("/users/logout", {
        method: "POST",
      });
    } finally {
      sessionStorage.removeItem("token");
      localStorage.removeItem("token");
      setUser(null);
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === "Administrator",
    login,
    register,
    logout,
    setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};