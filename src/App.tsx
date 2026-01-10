import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "./app/hooks";
import {
  restoreSession,
  initRootAdminAsync,
  createSuperAdminAsync,
  createAdminAsync,
  createUserAsync,
} from "./features/auth/authSlice";
import Layout from "./components/Layout";
import LoginForm from "./components/LoginForm";
import GenericUserForm from "./components/GenericUserForm";
import { UserCreationMode } from "./types";
import DashboardRouter from "./components/DashboardRouter";
import LandingPage from "./components/LandingPage";

function App() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, userRole } = useAppSelector((state) => state.auth);

  // Restore session from localStorage on app mount
  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Public Routes */}
        <Route index element={<LandingPage />} />
        <Route
          path="login"
          element={
            !isAuthenticated ? (
              <LoginForm />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="init-rootadmin"
          element={
            !isAuthenticated ? (
              <GenericUserForm
                mode={UserCreationMode.INIT_ROOT_ADMIN}
                onSubmitAction={initRootAdminAsync}
                title="Initialize Root Admin"
                description="Create the root administrator account"
                successMessage="Root Admin created successfully. Please login."
                redirectPath="/login"
                requireAuth={false}
              />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />

        {/* Protected Routes */}
        <Route
          path="dashboard"
          element={
            isAuthenticated ? (
              <DashboardRouter />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* RootAdmin Routes */}
        <Route
          path="create-superadmin"
          element={
            isAuthenticated && userRole === "ROOTADMIN" ? (
              <GenericUserForm
                mode={UserCreationMode.CREATE_SUPER_ADMIN}
                onSubmitAction={createSuperAdminAsync}
                title="Create Super Admin"
                description="Add a new super administrator to the system"
                successMessage="Super Admin created successfully."
                redirectPath="/dashboard"
              />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />

        {/* SuperAdmin/RootAdmin Routes */}
        <Route
          path="create-admin"
          element={
            isAuthenticated &&
            (userRole === "ROOTADMIN" || userRole === "SUPERADMIN") ? (
              <GenericUserForm
                mode={UserCreationMode.CREATE_ADMIN}
                onSubmitAction={createAdminAsync}
                title="Create Admin"
                description="Add a new administrator to the system"
                successMessage="Admin created successfully."
                redirectPath="/dashboard"
              />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />

        {/* Helper Routes */}
        <Route
          path="create-user"
          element={
            isAuthenticated &&
            (userRole === "ROOTADMIN" ||
              userRole === "SUPERADMIN" ||
              userRole === "ADMIN") ? (
              <GenericUserForm
                mode={UserCreationMode.CREATE_USER}
                onSubmitAction={createUserAsync}
                title="Create User"
                description="Add a new user to the system"
                successMessage="User created successfully."
                redirectPath="/dashboard"
              />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />

        {/* Default Route */}
        <Route
          path="*"
          element={
            <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
