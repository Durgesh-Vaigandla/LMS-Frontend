import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../app/hooks";
import { logout } from "../features/auth/authSlice";

const Navbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, userRole } = useAppSelector(
    (state) => state.auth
  );

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white border-b border-border shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-text">LMS</h1>
              <p className="text-xs text-text-secondary hidden sm:block">
                Learning Management System
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-4">
              <div className="text-sm text-right">
                <div className="font-medium text-text">{user}</div>
                <div className="text-xs px-2 py-0.5 rounded bg-primary text-white inline-block">
                  {userRole}
                </div>
              </div>

              <nav className="flex items-center gap-2">
                {/* Root Admin Navigation */}
                {userRole === "ROOTADMIN" && (
                  <>
                    <Link
                      to="/dashboard"
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        isActive("/dashboard")
                          ? "bg-primary text-white"
                          : "text-text-secondary hover:text-text hover:bg-gray-100"
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/create-superadmin"
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        isActive("/create-superadmin")
                          ? "bg-primary text-white"
                          : "text-text-secondary hover:text-text hover:bg-gray-100"
                      }`}
                    >
                      + Super Admin
                    </Link>
                    <Link
                      to="/create-admin"
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        isActive("/create-admin")
                          ? "bg-primary text-white"
                          : "text-text-secondary hover:text-text hover:bg-gray-100"
                      }`}
                    >
                      + Admin
                    </Link>
                    <Link
                      to="/create-user"
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        isActive("/create-user")
                          ? "bg-primary text-white"
                          : "text-text-secondary hover:text-text hover:bg-gray-100"
                      }`}
                    >
                      + User
                    </Link>
                  </>
                )}

                {/* Super Admin Navigation */}
                {userRole === "SUPERADMIN" && (
                  <>
                    <Link
                      to="/dashboard"
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        isActive("/dashboard")
                          ? "bg-primary text-white"
                          : "text-text-secondary hover:text-text hover:bg-gray-100"
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/create-admin"
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        isActive("/create-admin")
                          ? "bg-primary text-white"
                          : "text-text-secondary hover:text-text hover:bg-gray-100"
                      }`}
                    >
                      + Admin
                    </Link>
                    <Link
                      to="/create-user"
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        isActive("/create-user")
                          ? "bg-primary text-white"
                          : "text-text-secondary hover:text-text hover:bg-gray-100"
                      }`}
                    >
                      + User
                    </Link>
                  </>
                )}

                {/* Admin Navigation */}
                {userRole === "ADMIN" && (
                  <>
                    <Link
                      to="/dashboard"
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        isActive("/dashboard")
                          ? "bg-primary text-white"
                          : "text-text-secondary hover:text-text hover:bg-gray-100"
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/create-user"
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        isActive("/create-user")
                          ? "bg-primary text-white"
                          : "text-text-secondary hover:text-text hover:bg-gray-100"
                      }`}
                    >
                      + User
                    </Link>
                  </>
                )}

                {/* User Navigation */}
                {userRole === "USER" && (
                  <Link
                    to="/dashboard"
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isActive("/dashboard")
                        ? "bg-primary text-white"
                        : "text-text-secondary hover:text-text hover:bg-gray-100"
                    }`}
                  >
                    My Profile
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-md text-sm font-medium bg-secondary text-white hover:bg-primary transition-colors ml-2"
                >
                  Sign Out
                </button>
              </nav>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login"
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive("/login")
                    ? "bg-primary text-white"
                    : "text-text-secondary hover:text-text hover:bg-gray-100"
                }`}
              >
                Sign In
              </Link>
              <Link
                to="/init-rootadmin"
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive("/init-rootadmin")
                    ? "bg-primary text-white"
                    : "bg-secondary text-white hover:bg-primary"
                }`}
              >
                Root Setup
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            {isAuthenticated && (
              <div className="text-xs text-right mr-2">
                <div className="font-medium text-text truncate max-w-[80px]">
                  {user?.split("@")[0]}
                </div>
                <div className="text-[10px] px-1.5 py-0.5 rounded bg-primary text-white inline-block">
                  {userRole}
                </div>
              </div>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-text-secondary hover:text-text hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            >
              <span className="sr-only">Open main menu</span>
              {!isMobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-50 border-t border-border">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {isAuthenticated ? (
              <>
                {userRole === "ROOTADMIN" && (
                  <>
                    <Link
                      to="/dashboard"
                      className="block px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:text-text hover:bg-gray-100"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/create-superadmin"
                      className="block px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:text-text hover:bg-gray-100"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      + Super Admin
                    </Link>
                    <Link
                      to="/create-admin"
                      className="block px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:text-text hover:bg-gray-100"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      + Admin
                    </Link>
                    <Link
                      to="/create-user"
                      className="block px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:text-text hover:bg-gray-100"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      + User
                    </Link>
                  </>
                )}

                {userRole === "SUPERADMIN" && (
                  <>
                    <Link
                      to="/dashboard"
                      className="block px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:text-text hover:bg-gray-100"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/create-admin"
                      className="block px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:text-text hover:bg-gray-100"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      + Admin
                    </Link>
                    <Link
                      to="/create-user"
                      className="block px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:text-text hover:bg-gray-100"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      + User
                    </Link>
                  </>
                )}

                {userRole === "ADMIN" && (
                  <>
                    <Link
                      to="/dashboard"
                      className="block px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:text-text hover:bg-gray-100"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/create-user"
                      className="block px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:text-text hover:bg-gray-100"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      + User
                    </Link>
                  </>
                )}

                {userRole === "USER" && (
                  <Link
                    to="/dashboard"
                    className="block px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:text-text hover:bg-gray-100"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Profile
                  </Link>
                )}

                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-700 hover:bg-gray-100"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:text-text hover:bg-gray-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/init-rootadmin"
                  className="block px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:text-text hover:bg-gray-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Root Setup
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
export default Navbar;
