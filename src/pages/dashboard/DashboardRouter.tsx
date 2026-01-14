import React from "react";
import { Routes, Route } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import RootDashboard from "./root/RootDashboard";
import SuperAdminDashboard from "./super-admin/SuperAdminDashboard";
import AdminRouter from "./admin/AdminRouter";
import StudentDashboard from "./student/StudentDashboard";
import TakeTest from "./student/TakeTestPage";

const DashboardRouter: React.FC = () => {
  const { userRole } = useAppSelector((state) => state.auth);

  if (userRole === "ADMIN") {
    return <AdminRouter />;
  }

  return (
    <Routes>
      <Route
        index
        element={
          userRole === "ROOTADMIN" ? (
            <RootDashboard />
          ) : userRole === "SUPERADMIN" ? (
            <SuperAdminDashboard />
          ) : userRole === "USER" ? (
            <StudentDashboard />
          ) : (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-text mb-2">Welcome</h2>
                <p className="text-text-secondary">
                  Please navigate using the menu.
                </p>
              </div>
            </div>
          )
        }
      />
      {userRole === "USER" && (
        <Route path="test/take/:testId" element={<TakeTest />} />
      )}
    </Routes>
  );
};

export default DashboardRouter;
