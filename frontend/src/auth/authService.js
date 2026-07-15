import apiClient from "../api/apiClient";

const authService = {
  login: async (credentials) => {
    const response = await apiClient.post("/api/accounts/login/", credentials);
    if (response.data.access) {
      localStorage.setItem("token", response.data.access);
      localStorage.setItem("refresh", response.data.refresh);
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh");
  },

  getCurrentToken: () => {
    return localStorage.getItem("token");
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },
};

export default authService;
