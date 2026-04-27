/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from "react";
import { Navigate, createBrowserRouter } from "react-router-dom";
import PrivateRoute from "./components/layout/PrivateRoute";

const AuthPage = lazy(() => import("./pages/Auth"));
const DashboardPage = lazy(() => import("./pages/Dashboard"));
const AssetsPage = lazy(() => import("./pages/Assets"));
const WorkOrdersPage = lazy(() => import("./pages/WorkOrders"));
const MaintenancePage = lazy(() => import("./pages/Maintenance"));
const UsersPage = lazy(() => import("./pages/Users"));
const AccessDeniedPage = lazy(() => import("./pages/AccessDenied"));

function withPageLoader(element) {
  return <Suspense fallback={<div className="app-loading">Đang tải...</div>}>{element}</Suspense>;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/auth",
    element: withPageLoader(<AuthPage />),
  },
  {
    path: "/dashboard",
    element: withPageLoader(
      <PrivateRoute>
        <DashboardPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/assets",
    element: withPageLoader(
      <PrivateRoute>
        <AssetsPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/work-orders",
    element: withPageLoader(
      <PrivateRoute>
        <WorkOrdersPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/maintenance",
    element: withPageLoader(
      <PrivateRoute allowedRoles={["admin", "site_manager", "accountant"]}>
        <MaintenancePage />
      </PrivateRoute>
    ),
  },
  {
    path: "/users",
    element: withPageLoader(
      <PrivateRoute allowedRoles={["admin"]}>
        <UsersPage />
      </PrivateRoute>
    ),
  },
  {
    path: "/forbidden",
    element: withPageLoader(
      <PrivateRoute>
        <AccessDeniedPage />
      </PrivateRoute>
    ),
  },
  {
    path: "*",
    element: <Navigate to="/auth" replace />,
  },
]);

export default router;
