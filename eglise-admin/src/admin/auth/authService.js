// src/admin/auth/authService.js
import apiClient from "../../api/apiClient";

const adminAuthService = {
  /**
   * Login with username OR email.
   * The identifier is sent under both "username" and "email" so the backend
   * can read whichever field it expects.
   */
  login: async (credentials) => {
    const identifier = (credentials?.username || credentials?.email || "").trim();
    const password = credentials?.password;

    if (!identifier) {
      throw new Error("Username or email is required");
    }
    if (!password) {
      throw new Error("Password is required");
    }

    const loginData = {
      username: identifier,
      email: identifier,
      password,
    };

    const response = await apiClient.post("/api/accounts/admin/login/", loginData);

    if (response.data?.access) {
      localStorage.setItem("admin_token", response.data.access);
      localStorage.setItem("admin_refresh", response.data.refresh);
      localStorage.setItem("admin_user", JSON.stringify(response.data.user));
    }

    return response.data;
  },

  logout: () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_refresh");
    localStorage.removeItem("admin_user");
  },

  getCurrentToken: () => localStorage.getItem("admin_token"),

  getRefreshToken: () => localStorage.getItem("admin_refresh"),

  getCurrentUser: () => {
    const user = localStorage.getItem("admin_user");
    if (!user) return null;
    try {
      return JSON.parse(user);
    } catch {
      return null;
    }
  },

  isAuthenticated: () => !!localStorage.getItem("admin_token"),

  refreshToken: async () => {
    const refresh = localStorage.getItem("admin_refresh");
    if (!refresh) {
      throw new Error("No refresh token available");
    }

    try {
      const response = await apiClient.post("/api/accounts/token/refresh/", { refresh });
      if (response.data?.access) {
        localStorage.setItem("admin_token", response.data.access);
      }
      return response.data;
    } catch (error) {
      adminAuthService.logout();
      throw error;
    }
  },

  getAuthHeaders: () => {
    const token = adminAuthService.getCurrentToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  isAdmin: () => {
    const user = adminAuthService.getCurrentUser();
    if (!user) return false;
    return user.role === "ADMIN" || user.is_superuser === true || user.is_staff === true;
  },

  getUserDisplayName: () => {
    const user = adminAuthService.getCurrentUser();
    if (!user) return null;
    if (user.first_name) {
      return `${user.first_name} ${user.last_name || ""}`.trim();
    }
    return user.username || user.email;
  },

  updateUser: (userData) => {
    const updatedUser = { ...adminAuthService.getCurrentUser(), ...userData };
    localStorage.setItem("admin_user", JSON.stringify(updatedUser));
    return updatedUser;
  },
};

export default adminAuthService;