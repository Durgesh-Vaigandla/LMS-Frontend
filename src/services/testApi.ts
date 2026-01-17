import axios from "axios";
import type { ApiResponse } from "./authApi";
import type {
  Test,
  CreateTestRequest,
  UpdateTestRequest,
  Question,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  Attempt,
  SubmitAnswerRequest,
  Answer,
  SessionReport,
  UpdateSessionReportRequest,
  FinalizeSessionReportRequest,
  Result,
  AttemptStateResponse,
  AttemptInfo,
} from "../types";

// Axios instance (reuse from authApi)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
  withCredentials: true,
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Test API calls
export const testApi = {
  // Get my tests (admin)
  getMyTests: async (): Promise<ApiResponse<Test[]>> => {
    const response = await api.get("/api/tests/mine");
    return response.data;
  },

  // Get available tests (user)
  getAvailableTests: async (): Promise<ApiResponse<Test[]>> => {
    const response = await api.get("/api/tests/available");
    return response.data;
  },

  // Create test
  createTest: async (data: CreateTestRequest): Promise<ApiResponse<Test>> => {
    const response = await api.post("/api/tests", data);
    return response.data;
  },

  // Update test
  updateTest: async (
    testId: number,
    data: UpdateTestRequest
  ): Promise<ApiResponse<Test>> => {
    const response = await api.patch(`/api/tests/${testId}`, data);
    return response.data;
  },

  // Publish test
  publishTest: async (testId: number): Promise<ApiResponse<void>> => {
    const response = await api.patch(`/api/tests/${testId}/publish`);
    return response.data;
  },

  // Delete test
  deleteTest: async (testId: number): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/api/tests/${testId}`);
    return response.data;
  },

  // Delete result
  deleteResult: async (resultId: number): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/api/results/${resultId}`);
    return response.data;
  },

  // Get questions for a test
  getQuestions: async (testId: number): Promise<ApiResponse<Question[]>> => {
    const response = await api.get(`/api/tests/${testId}/questions`);
    return response.data;
  },

  // Create question
  createQuestion: async (
    testId: number,
    data: CreateQuestionRequest
  ): Promise<ApiResponse<Question>> => {
    const response = await api.post(`/api/tests/${testId}/questions`, data);
    return response.data;
  },

  // Update question
  updateQuestion: async (
    questionId: number,
    data: UpdateQuestionRequest
  ): Promise<ApiResponse<Question>> => {
    const response = await api.put(`/api/questions/${questionId}`, data);
    return response.data;
  },

  // Delete question
  deleteQuestion: async (questionId: number): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/api/questions/${questionId}`);
    return response.data;
  },

  // Start attempt
  startAttempt: async (testId: number): Promise<ApiResponse<Attempt>> => {
    const response = await api.post(`/api/tests/${testId}/attempts`, {});
    return response.data;
  },

  // Get attempt state for resume
  getAttemptState: async (
    attemptId: number
  ): Promise<ApiResponse<AttemptStateResponse>> => {
    const response = await api.get(`/api/attempts/${attemptId}/state`);
    return response.data;
  },

  // Get test attempt state from testId (smart resume/start)
  getTestAttemptState: async (
    testId: number
  ): Promise<ApiResponse<AttemptStateResponse>> => {
    const response = await api.get(`/api/tests/${testId}/attempts/me/state`);
    return response.data;
  },

  // Get latest attempt for a test
  getLatestAttempt: async (
    testId: number,
    onlyIncomplete: boolean = true
  ): Promise<ApiResponse<AttemptInfo>> => {
    const response = await api.get(`/api/tests/${testId}/attempts/me/latest`, {
      params: { onlyIncomplete },
    });
    return response.data;
  },

  // Get attempt
  getAttempt: async (attemptId: number): Promise<ApiResponse<Attempt>> => {
    const response = await api.get(`/api/attempts/${attemptId}`);
    return response.data;
  },

  // Submit answer
  submitAnswer: async (
    attemptId: number,
    data: SubmitAnswerRequest
  ): Promise<ApiResponse<Answer>> => {
    const response = await api.post(`/api/attempts/${attemptId}/answers`, data);
    return response.data;
  },

  // Submit attempt
  submitAttempt: async (attemptId: number): Promise<ApiResponse<Attempt>> => {
    const response = await api.post(`/api/attempts/${attemptId}/submit`);
    return response.data;
  },

  // Update session report
  updateSessionReport: async (
    attemptId: number,
    data: UpdateSessionReportRequest
  ): Promise<ApiResponse<SessionReport>> => {
    const response = await api.post(
      `/api/attempts/${attemptId}/session-report`,
      data
    );
    return response.data;
  },

  // Finalize session report
  finalizeSessionReport: async (
    attemptId: number,
    data: FinalizeSessionReportRequest
  ): Promise<ApiResponse<SessionReport>> => {
    const response = await api.post(
      `/api/attempts/${attemptId}/session-report/finalize`,
      data
    );
    return response.data;
  },

  // Get session report
  getSessionReport: async (
    attemptId: number
  ): Promise<ApiResponse<SessionReport>> => {
    const response = await api.get(`/api/attempts/${attemptId}/session-report`);
    return response.data;
  },

  // Get admin results
  getAdminResults: async (): Promise<ApiResponse<Result[]>> => {
    const response = await api.get("/api/admin/results");
    return response.data;
  },

  // Get results for a test
  getTestResults: async (testId: number): Promise<ApiResponse<Result[]>> => {
    const response = await api.get(`/api/admin/tests/${testId}/results`);
    return response.data;
  },

  // Get my results (user)
  getMyResults: async (): Promise<ApiResponse<Result[]>> => {
    const response = await api.get("/api/me/results");
    return response.data;
  },
};
