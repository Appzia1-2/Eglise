// src/api/apiClient.js
import axios from "axios";

// Remove any trailing slash so URLs never become "...//api/..."
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

// Public endpoints: never send a token, never try to refresh on 401
const PUBLIC_PATHS = [
  "/api/accounts/login/",
  "/api/accounts/auth/check-email/",
  "/api/accounts/token/refresh/",
];
const isPublic = (url = "") => PUBLIC_PATHS.some((p) => url.includes(p));

const STORAGE_KEYS = [
  "token",
  "refresh",
  "admin_token",
  "admin_refresh",
  "admin_user",
  "user",
  "user_role",
  "force_password_change",
];

const clearSession = () => {
  STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
};

// Go back to the login page (served at "/"), but never reload if already there
const redirectToLogin = () => {
  if (window.location.pathname !== "/") {
    window.location.replace("/");
  }
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// ---------- Request interceptor ----------
apiClient.interceptors.request.use(
  (config) => {
    if (!isPublic(config.url)) {
      const token =
        localStorage.getItem("token") || localStorage.getItem("admin_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // FormData: let the browser set Content-Type with the boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    } else if (config.data && typeof config.data === "object") {
      if (!config.headers["Content-Type"]) {
        config.headers["Content-Type"] = "application/json";
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ---------- Response interceptor ----------
let refreshPromise = null; // one refresh at a time

const refreshAccessToken = async () => {
  const refreshToken =
    localStorage.getItem("refresh") || localStorage.getItem("admin_refresh");
  if (!refreshToken) throw new Error("No refresh token");

  const res = await axios.post(`${API_BASE_URL}/api/accounts/token/refresh/`, {
    refresh: refreshToken,
  });

  const access = res.data.access;
  localStorage.setItem("token", access);
  localStorage.setItem("admin_token", access);
  if (res.data.refresh) {
    localStorage.setItem("refresh", res.data.refresh);
    localStorage.setItem("admin_refresh", res.data.refresh);
  }
  return access;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Not a 401, or a public endpoint (wrong password etc.): just pass the error on
    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      isPublic(originalRequest.url) ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const newAccess = await refreshPromise;
      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      clearSession();
      redirectToLogin();
      return Promise.reject(refreshError);
    }
  }
);

export default apiClient;