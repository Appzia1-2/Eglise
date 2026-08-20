// apiClient.js

import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/";
console.log("Using API_BASE_URL:", API_BASE_URL);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // Remove default Content-Type header - let axios set it per request
  // headers: {
  //   "Content-Type": "application/json",
  // },
});

// Request interceptor to add token and handle content types
apiClient.interceptors.request.use(
  (config) => {
    // Try both regular token and admin token
    const token = localStorage.getItem("token") || localStorage.getItem("admin_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("Adding token to request:", config.url);
    } else {
      console.log("No token found for request:", config.url);
    }

    // IMPORTANT: Handle FormData properly
    // If the data is FormData, remove Content-Type header so browser can set it with boundary
    if (config.data instanceof FormData) {
      console.log("FormData detected - removing Content-Type header");
      delete config.headers["Content-Type"];
      // The browser will automatically set Content-Type with the correct boundary
    } else if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
      // For regular JSON data, set Content-Type to application/json
      if (!config.headers["Content-Type"]) {
        config.headers["Content-Type"] = "application/json";
      }
    }

    console.log(`Making ${config.method.toUpperCase()} request to: ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refresh") || localStorage.getItem("admin_refresh");
        
        if (!refreshToken) {
          localStorage.removeItem("token");
          localStorage.removeItem("admin_token");
          localStorage.removeItem("refresh");
          localStorage.removeItem("admin_refresh");
          window.location.href = "/admin";
          return Promise.reject(error);
        }

        const response = await axios.post(
          `${API_BASE_URL}/api/accounts/token/refresh/`,
          { refresh: refreshToken }
        );
        
        const newAccessToken = response.data.access;
        
        localStorage.setItem("token", newAccessToken);
        localStorage.setItem("admin_token", newAccessToken);
        
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("token");
        localStorage.removeItem("admin_token");
        localStorage.removeItem("refresh");
        localStorage.removeItem("admin_refresh");
        localStorage.removeItem("admin_user");
        window.location.href = "/admin";
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;