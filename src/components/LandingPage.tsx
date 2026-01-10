import React from "react";
import { Link } from "react-router-dom";

const LandingPage: React.FC = () => {
  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="bg-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-text tracking-tight mb-4">
            Welcome to the <span className="text-primary">BKIT LMS</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-text-secondary mb-8">
            Empower your learning journey with our state-of-the-art Learning
            Management System. Streamline administration, enhance engagement,
            and achieve educational excellence.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/login"
              className="px-8 py-3 rounded-md bg-primary text-white font-semibold text-lg hover:bg-opacity-90 transition-colors"
            >
              Get Started
            </Link>
            <Link
              to="/init-rootadmin"
              className="px-8 py-3 rounded-md bg-white border border-border text-text font-semibold text-lg hover:bg-gray-50 transition-colors"
            >
              Root Setup
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text mb-4">
              Why Choose BKIT LMS?
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Our platform offers a comprehensive suite of tools designed to
              make learning management efficient and intuitive.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-primary">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-text mb-2">
                User Management
              </h3>
              <p className="text-text-secondary">
                Effortlessly manage students, instructors, and administrators.
                Assign roles and permissions with ease.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-primary">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-text mb-2">
                Course Monitoring
              </h3>
              <p className="text-text-secondary">
                Track progress, attendance, and performance metrics in
                real-time. Generate detailed reports for analysis.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-primary">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-text mb-2">
                Easy Integration
              </h3>
              <p className="text-text-secondary">
                Seamlessly allows for scalable architecture and modules.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-text-secondary">
            &copy; {new Date().getFullYear()} BKIT LMS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
