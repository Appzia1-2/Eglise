import React from "react";
import { Navigate } from "react-router-dom";
import adminAuthService from "../auth/authService";

const AdminProtectedRoute = ({ children }) => {
  if (!adminAuthService.isAuthenticated()) {
    return <Navigate to="/admin" replace />;
  }
  return children;
};

export default AdminProtectedRoute;