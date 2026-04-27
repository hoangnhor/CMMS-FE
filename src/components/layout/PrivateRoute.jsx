import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

function PrivateRoute({ children, allowedRoles = null }) {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);
  const hydrate = useAuthStore((state) => state.hydrate);
  const location = useLocation();

  useEffect(() => {
    if (!hydrated) {
      hydrate();
    }
  }, [hydrate, hydrated]);

  if (!hydrated) {
    return <div className="app-loading">Đang tải...</div>;
  }

  if (!token) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const role = user?.role;
    if (!role || !allowedRoles.includes(role)) {
      return <Navigate to="/forbidden" replace state={{ from: location }} />;
    }
  }

  return children;
}

export default PrivateRoute;
