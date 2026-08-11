import apiClient from "../../api/apiClient";

const adminAuthService = {
  /**
   * Login with username OR email
   *
   * The backend accepts:
   * {
   *   username: "admin"
   *   password: "password"
   * }
   *
   * OR:
   * {
   *   username: "admin@gmail.com"
   *   password: "password"
   * }
   */
  login: async (credentials) => {
    const identifier = credentials?.username?.trim();
    const password = credentials?.password;

    console.log("Admin login attempt:", {
      hasUsernameOrEmail: !!identifier,
      hasPassword: !!password,
    });

    if (!identifier) {
      throw new Error("Username or email is required");
    }

    if (!password) {
      throw new Error("Password is required");
    }

    // Always send the identifier as "username".
    // It can contain either a username or an email.
    const loginData = {
      username: identifier,
      password: password,
    };

    try {
      const response = await apiClient.post(
        "/api/accounts/admin/login/",
        loginData
      );

      console.log("Admin login response:", {
        status: response.status,
        hasAccess: !!response.data?.access,
        user:
          response.data?.user?.username ||
          response.data?.user?.email,
      });

      if (response.data?.access) {
        // Store admin tokens
        localStorage.setItem(
          "admin_token",
          response.data.access
        );

        localStorage.setItem(
          "admin_refresh",
          response.data.refresh
        );

        // Store admin user
        localStorage.setItem(
          "admin_user",
          JSON.stringify(response.data.user)
        );

        console.log(
          "Admin token stored successfully for:",
          response.data.user?.username
        );
      }

      return response.data;
    } catch (error) {
      console.error("Admin login error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      throw error;
    }
  },

  /**
   * Logout admin
   */
  logout: () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_refresh");
    localStorage.removeItem("admin_user");

    console.log("Admin logged out");
  },

  /**
   * Get current admin access token
   */
  getCurrentToken: () => {
    const token = localStorage.getItem("admin_token");

    console.log(
      "Getting admin token:",
      token ? "Found" : "Not found"
    );

    return token;
  },

  /**
   * Get current admin refresh token
   */
  getRefreshToken: () => {
    return localStorage.getItem("admin_refresh");
  },

  /**
   * Get logged-in admin user
   */
  getCurrentUser: () => {
    const user = localStorage.getItem("admin_user");

    if (!user) {
      return null;
    }

    try {
      return JSON.parse(user);
    } catch (error) {
      console.error(
        "Error parsing admin user:",
        error
      );

      return null;
    }
  },

  /**
   * Check whether admin is logged in
   */
  isAuthenticated: () => {
    const isAuth = !!localStorage.getItem("admin_token");

    console.log(
      "Admin is authenticated:",
      isAuth
    );

    return isAuth;
  },

  /**
   * Refresh access token
   */
  refreshToken: async () => {
    const refresh =
      localStorage.getItem("admin_refresh");

    if (!refresh) {
      console.error(
        "No refresh token available"
      );

      throw new Error(
        "No refresh token available"
      );
    }

    try {
      const response = await apiClient.post(
        "/api/accounts/token/refresh/",
        {
          refresh: refresh,
        }
      );

      if (response.data?.access) {
        localStorage.setItem(
          "admin_token",
          response.data.access
        );

        console.log(
          "Admin token refreshed successfully"
        );
      }

      return response.data;
    } catch (error) {
      console.error(
        "Token refresh failed:",
        error
      );

      adminAuthService.logout();

      throw error;
    }
  },

  /**
   * Get authorization headers
   */
  getAuthHeaders: () => {
    const token =
      adminAuthService.getCurrentToken();

    if (token) {
      return {
        Authorization: `Bearer ${token}`,
      };
    }

    return {};
  },

  /**
   * Check whether current user is an admin
   */
  isAdmin: () => {
    const user =
      adminAuthService.getCurrentUser();

    if (!user) {
      return false;
    }

    return (
      user.role === "ADMIN" ||
      user.is_superuser === true ||
      user.is_staff === true
    );
  },

  /**
   * Get user's display name
   */
  getUserDisplayName: () => {
    const user =
      adminAuthService.getCurrentUser();

    if (!user) {
      return null;
    }

    if (user.first_name) {
      return `${user.first_name} ${
        user.last_name || ""
      }`.trim();
    }

    return user.username || user.email;
  },

  /**
   * Update stored admin user information
   */
  updateUser: (userData) => {
    const currentUser =
      adminAuthService.getCurrentUser();

    const updatedUser = {
      ...currentUser,
      ...userData,
    };

    localStorage.setItem(
      "admin_user",
      JSON.stringify(updatedUser)
    );

    return updatedUser;
  },
};

export default adminAuthService;

