import React from "react";
import { useAppSelector } from "../app/hooks";
import RootDashboard from "./RootDashboard";
import SuperAdminDashboard from "./SuperAdminDashboard";
import AdminDashboard from "./AdminDashboard";

const DashboardRouter: React.FC = () => {
  const { userRole } = useAppSelector((state) => state.auth);

  if (userRole === "ROOTADMIN") {
    return <RootDashboard />;
  }

  if (userRole === "SUPERADMIN") {
    return <SuperAdminDashboard />;
  }

  if (userRole === "ADMIN") {
    return <AdminDashboard />;
  }

  // Default fallback for regular users (students) or unknown roles
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-text mb-2">Welcome</h2>
        <p className="text-text-secondary">Please navigate using the menu.</p>
      </div>
    </div>
  );
};

export default DashboardRouter;
