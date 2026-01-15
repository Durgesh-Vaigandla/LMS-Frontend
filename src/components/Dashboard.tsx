import React, { useState, useEffect } from "react";
import { useAppSelector } from "../app/hooks";
import LoginForm from "../pages/auth/LoginPage";
import UserLists from "./admin/users/UserList";
import Navbar from "./common/Navbar";

type ViewType = "login" | "dashboard";

const Dashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>("login");
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Auto-navigate to dashboard when logged in
  useEffect(() => {
    if (isAuthenticated && currentView === "login") {
      setCurrentView("dashboard");
    }
  }, [isAuthenticated, currentView]);

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <UserLists />;
      case "login":
        return <LoginForm />;
      default:
        return <LoginForm />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Main Content */}
      <main>{renderView()}</main>
    </div>
  );
};

export default Dashboard;
