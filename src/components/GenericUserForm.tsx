import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { clearError } from "../features/auth/authSlice";
import { UserCreationMode } from "../types";

interface GenericUserFormProps {
  mode: UserCreationMode;
  onSubmitAction: (data: any) => any;
  title: string;
  description: string;
  successMessage: string;
  redirectPath: string;
  requireAuth?: boolean;
}

const GenericUserForm: React.FC<GenericUserFormProps> = ({
  mode,
  onSubmitAction,
  title,
  description,
  successMessage,
  redirectPath,
  requireAuth = true,
}) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useAppSelector(
    (state) => state.auth
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(onSubmitAction(formData)).unwrap();
      alert(successMessage);
      navigate(redirectPath);
    } catch (error) {
      // Error is handled by the slice
    }
  };

  const handleClearError = () => {
    dispatch(clearError());
  };

  if (requireAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-surface p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-text mb-4">Access Denied</h2>
          <p className="text-text-secondary">
            Please log in to perform this action.
          </p>
        </div>
      </div>
    );
  }

  const getIconColor = () => {
    switch (mode) {
      case UserCreationMode.INIT_ROOT_ADMIN:
        return "bg-primary";
      case UserCreationMode.CREATE_SUPER_ADMIN:
        return "bg-secondary";
      case UserCreationMode.CREATE_ADMIN:
        return "bg-secondary";
      case UserCreationMode.CREATE_USER:
        return "bg-accent";
      default:
        return "bg-primary";
    }
  };

  return (
    <div className="bg-background flex items-center justify-center p-4">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md max-w-md w-full">
        <div className="text-center mb-6">
          <div
            className={`w-16 h-16 ${getIconColor()} rounded-lg flex items-center justify-center mx-auto mb-4`}
          >
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text mb-1">{title}</h2>
          <p className="text-sm text-text-secondary">{description}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-text mb-1.5"
            >
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text transition-colors"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-text mb-1.5"
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text transition-colors"
              placeholder="Enter email address"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-text mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text transition-colors"
              placeholder="Enter password (min 6 characters)"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full ${getIconColor()} hover:opacity-90 disabled:bg-text-secondary text-white font-medium py-2.5 px-4 rounded-md transition-colors duration-200 disabled:cursor-not-allowed`}
          >
            {loading ? "Processing..." : title}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-accent/10 border border-accent/20 rounded-md">
            <div className="flex justify-between items-center">
              <p className="text-accent text-sm">{error}</p>
              <button
                onClick={handleClearError}
                className="text-accent hover:text-secondary text-sm font-medium"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenericUserForm;
