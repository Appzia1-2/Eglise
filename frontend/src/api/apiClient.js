import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/";
console.log("Using API_BASE_URL:", API_BASE_URL);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add token
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