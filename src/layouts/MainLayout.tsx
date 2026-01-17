import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/common/Navbar";

const Layout: React.FC = () => {
  const location = useLocation();
  const isTestPage = location.pathname.includes("/test/take/");

  if (isTestPage) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="w-full">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
