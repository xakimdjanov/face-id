import React from "react";
import { Navigate } from "react-router-dom";
import { getDefaultRouteByRole, getStoredUser } from "../utils/auth";

const ProtectedRoute = ({ children, role }) => {
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={getDefaultRouteByRole(user.role)} replace />;
  }

  return children;
};

export default ProtectedRoute;