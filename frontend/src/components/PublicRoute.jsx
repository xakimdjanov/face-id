import React from "react";
import { Navigate } from "react-router-dom";
import { getDefaultRouteByRole, getStoredUser } from "../utils/auth";

const PublicRoute = ({ children }) => {
  const user = getStoredUser();

  if (user) {
    return <Navigate to={getDefaultRouteByRole(user.role)} replace />;
  }

  return children;
};

export default PublicRoute;