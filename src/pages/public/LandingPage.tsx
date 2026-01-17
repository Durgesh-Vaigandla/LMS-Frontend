import React from "react";
import { Link } from "react-router-dom";

const LandingPage: React.FC = () => {
  return (
    <div className="bg-background min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-surface to-background pt-24 pb-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="w-full text-center relative z-10">
          <div className="inline-block px-4 py-1.5 bg-red-50 text-primary rounded-full text-sm font-semibold mb-8 animate-fade-in-up border border-red-100">
            Next Generation Learning Platform
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-text tracking-tight mb-8 leading-tight">
            Master Your Skills with <br className="hidden sm:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              BKIT LMS
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-text-secondary mb-10 leading-relaxed">
            A comprehensive learning management system designed for students,
            educators, and administrators. Seamlessly manage tests, track
            progress, and achieve educational excellence.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/login"
              className="px-8 py-4 bg-primary text-white text-lg font-semibold rounded-xl shadow-lg hover:bg-secondary hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              Get Started Now
            </Link>
            <Link
              to="/init-rootadmin"
              className="px-8 py-4 bg-white text-text border border-border text-lg font-semibold rounded-xl hover:bg-surface hover:border-text-secondary transition-all duration-300"
            >
              Root Setup
            </Link>
          </div>

          {/* Dashboard Preview Image Placeholder */}
          <div className="mt-16 relative mx-auto max-w-5xl rounded-2xl shadow-2xl border border-border overflow-hidden bg-white aspect-[16/9] animate-fade-in flex items-center justify-center group">
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            <div className="text-center p-8 z-10">
              <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-white font-semibold text-lg drop-shadow-md">Interactive Dashboard Experience</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-text mb-4">Why Choose BKIT LMS?</h2>
            <p className="text-text-secondary max-w-2xl mx-auto text-lg">
              Everything you need to manage education effectively in one unified platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 bg-surface rounded-2xl border border-border hover:shadow-lg transition-all duration-300 hover:border-primary/20 group">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-6 text-primary shadow-sm group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text mb-3">Smart Test Management</h3>
              <p className="text-text-secondary">
                Create, schedule, and grade tests automatically. Support for multiple question types and instant feedback.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 bg-surface rounded-2xl border border-border hover:shadow-lg transition-all duration-300 hover:border-primary/20 group">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-6 text-primary shadow-sm group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text mb-3">Advanced Analytics</h3>
              <p className="text-text-secondary">
                Track student performance with detailed analytics, progress reports, and comparative insights.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 bg-surface rounded-2xl border border-border hover:shadow-lg transition-all duration-300 hover:border-primary/20 group">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-6 text-primary shadow-sm group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text mb-3">Role-Based Access</h3>
              <p className="text-text-secondary">
                Secure access for Students, Admins, and Super Admins with dedicated dashboards and permissions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface border-t border-border mt-auto">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-text">BKIT LMS</span>
              </div>
              <p className="text-text-secondary max-w-sm">
                Empowering education through technology. Join thousands of students and educators on the platform.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-text mb-4">Product</h4>
              <ul className="space-y-2 text-text-secondary">
                <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Security</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-text mb-4">Support</h4>
              <ul className="space-y-2 text-text-secondary">
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-12 pt-8 text-center text-text-secondary text-sm">
            © {new Date().getFullYear()} BKIT LMS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
