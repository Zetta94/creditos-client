import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const isAuth = !!localStorage.getItem("token");
  const loading = false;

  const location = useLocation();
  if (loading) return null;
  if (!isAuth) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}
