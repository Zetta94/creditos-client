import React from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const { token, user, checkingSession } = useSelector(state => state.auth);

  if (checkingSession) return null;

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const roleNormalized = (user?.role || localStorage.getItem("role") || "").toLowerCase();
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
