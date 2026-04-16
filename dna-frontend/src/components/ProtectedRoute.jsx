import { Navigate } from "react-router-dom";

/**
 * Wraps protected pages. Redirects to /login if user has no JWT token.
 * Usage: <ProtectedRoute><Dashboard /></ProtectedRoute>
 */
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
