import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize auth from localStorage on mount
    const token = localStorage.getItem("access_token");
    const user_id = localStorage.getItem("user_id");
    const user_role = localStorage.getItem("user_role");
    const forcePasswordChange = localStorage.getItem("force_password_change");

    if (token && user_id) {
      setAuth({
        token,
        user: {
          id: user_id,
          role: user_role,
          forcePasswordChange: forcePasswordChange === "true",
        },
      });
    }
    setIsLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_role");
    localStorage.removeItem("force_password_change");
    setAuth(null);
  };

  const value = {
    auth,
    setAuth,
    logout,
    isLoading,
    isAuthenticated: !!auth?.token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export default AuthContext;