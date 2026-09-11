import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const ALLOWED_PATHS = [
  "/change-password",
  "/forgot-password",
  "/support",
  "/",
];

const ForcePasswordChange = ({ children }) => {
  const location = useLocation();
  const mustChange =
    localStorage.getItem("force_password_change") === "1";

  if (mustChange && !ALLOWED_PATHS.includes(location.pathname)) {
    return <Navigate to="/change-password" replace />;
  }

  return children;
};

export default ForcePasswordChange;