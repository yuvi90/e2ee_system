import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated, clearInvalidToken } from "../shared/utils/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();

  // Clear invalid tokens
  clearInvalidToken();

  if (!isAuthenticated()) {
    // Redirect to login with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

interface PublicRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  redirectTo = "/dashboard",
}) => {
  // Clear invalid tokens
  clearInvalidToken();

  if (isAuthenticated()) {
    // If user is already logged in, redirect to dashboard
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
