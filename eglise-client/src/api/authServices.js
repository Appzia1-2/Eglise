import apiClient from "./apiClient";

/**
 * Change the logged-in user's password.
 * @param {Object} data - { old_password, new_password, confirm_password }
 */
export const changePassword = (data) =>
  apiClient.post("/api/accounts/change-password/", data);

/**
 * Request a password reset OTP/email.
 * @param {Object} data - { email }
 */
export const forgotPassword = (data) =>
  apiClient.post("/api/accounts/auth/forgot-password/", data);

/**
 * Reset password using email, OTP, and new password.
 * @param {Object} data - { email, otp, new_password }
 */
export const resetPassword = (data) =>
  apiClient.post("/api/accounts/auth/reset-password/", data);
/**
 * Check if an email exists in the system.
 * @param {Object} data - { email }
 */
export const checkEmail = (data) =>
  apiClient.post("/api/accounts/auth/check-email/", data);
