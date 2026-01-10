import axios from "axios";

// Base URL from environment
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

// DTOs based on backend
export interface InitRootAdminRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
}

export interface CreateAdminRequest {
  email: string;
  password: string;
  name: string;
}

export interface CreateSuperAdminRequest {
  email: string;
  password: string;
  name: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  type: "ROOTADMIN" | "SUPERADMIN" | "ADMIN" | "USER";
}

// Axios instance with base URL
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Enable credentials for CORS
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API calls
export const authApi = {
  // Initialize root admin
  initRootAdmin: async (
    data: InitRootAdminRequest
  ): Promise<ApiResponse<void>> => {
    const response = await api.post("/api/auth/init-rootadmin", data);
    return response.data;
  },

  // Login
  login: async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post("/api/auth/login", data);
    return response.data;
  },

  // Create admin
  createAdmin: async (data: CreateAdminRequest): Promise<ApiResponse<void>> => {
    const response = await api.post("/api/auth/create-admin", data);
    return response.data;
  },

  // Create super admin
  createSuperAdmin: async (
    data: CreateSuperAdminRequest
  ): Promise<ApiResponse<void>> => {
    const response = await api.post("/api/auth/create-superadmin", data);
    return response.data;
  },

  // Create user
  createUser: async (data: CreateUserRequest): Promise<ApiResponse<void>> => {
    const response = await api.post("/api/auth/create-user", data);
    return response.data;
  },

  // Get all users (requires authentication)
  getAllUsers: async (): Promise<ApiResponse<User[]>> => {
    const response = await api.get("/api/users/all");
    return response.data;
  },
};
