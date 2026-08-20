import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute component
 * Redirects to password change page if user needs to change password
 * Allows access to specific routes (like password change, logout)
 */
const ProtectedRoute = ({ children, allowedWithoutPasswordChange = false }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const forcePasswordChange =
    localStorage.getItem("force_password_change") === "true";

  if (isLoading) {
    return null; // Or show a loading spinner
  }

  // Not logged in
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Password change required and this route doesn't allow it
  if (forcePasswordChange && !allowedWithoutPasswordChange) {
    return <Navigate to="/change-password" replace />;
  }

  return children;
};

export default ProtectedRoute;