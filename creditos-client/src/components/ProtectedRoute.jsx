import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const roleNormalized = role?.toLowerCase();
  const allowedNormalized = allowedRoles?.map(r => r.toLowerCase());

  const isEmployeeAsCobrador = roleNormalized === "employee" && allowedNormalized?.includes("cobrador");
  if (allowedNormalized && !allowedNormalized.includes(roleNormalized) && !isEmployeeAsCobrador) {
    if (roleNormalized === "cobrador" || roleNormalized === "employee") {
      return <Navigate to="/cobrador/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
}
