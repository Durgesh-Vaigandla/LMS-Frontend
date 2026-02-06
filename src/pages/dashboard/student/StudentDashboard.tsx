import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { testApi } from "../../../services/testApi";
import type { Test, Result } from "../../../types";

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [availableTests, setAvailableTests] = useState<Test[]>([]);
  const [myResults, setMyResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [testsError, setTestsError] = useState<string | null>(null);
  const [resultsError, setResultsError] = useState<string | null>(null);
  const [percentage, setPercentage] = useState<number>(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setTestsError(null);
      setResultsError(null);

      const [testsResponse, resultsResponse] = await Promise.allSettled([
        testApi.getAvailableTests(),
        testApi.getMyResults(),
      ]);

      if (testsResponse.status === "fulfilled") {
        if (testsResponse.value.success && testsResponse.value.data) {
          setAvailableTests(testsResponse.value.data);
        } else {
          setTestsError(testsResponse.value.message || "Failed to load tests");
        }
      } else {
        const status = testsResponse.reason?.response?.status;
        if (status === 401 || status === 403) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
          return;
        }
        setTestsError(
          testsResponse.reason?.response?.data?.message || "Failed to load tests"
        );
      }

      if (resultsResponse.status === "fulfilled") {
        if (resultsResponse.value.success && resultsResponse.value.data) {
          setMyResults(resultsResponse.value.data);

          // Calculate average percentage only from completed tests
          const completedTests = resultsResponse.value.data.filter(
            (r: Result) => r.completed
          );
          const reducedPercentage =
            completedTests.length > 0
              ? completedTests.reduce(
                (sum: number, r: Result) =>
                  sum + ((r.score / r.test.totalMarks) * 100 || 0),
                0
              ) / completedTests.length
              : 0;
          setPercentage(reducedPercentage);
        } else {
          setResultsError(
            resultsResponse.value.message || "Failed to load results"
          );
        }
      } else {
        const status = resultsResponse.reason?.response?.status;
        if (status === 401 || status === 403) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
          return;
        }
        setResultsError(
          resultsResponse.reason?.response?.data?.message ||
          "Failed to load results"
        );
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
        return;
      }
      setTestsError(err.response?.data?.message || "Failed to load data");
      setResultsError(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = (test: Test) => {
    navigate(`tests/${test.id}/instructions`);
  };

  const handleResumeTest = (test: Test) => {
    navigate(`tests/${test.id}/instructions`, { state: { resume: true } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-secondary font-medium">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (testsError && resultsError && availableTests.length === 0 && myResults.length === 0) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg border border-red-200 p-8 max-w-md">
          <div className="flex items-center space-x-3 mb-4">
            <div className="shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-text">
              Error Loading Dashboard
            </h3>
          </div>
          <p className="text-text-secondary">{testsError || resultsError}</p>
          <button
            onClick={fetchData}
            className="mt-4 w-full px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-secondary transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  const completedTests = myResults.length;
  const pendingTests = availableTests.length;

  return (
    <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text mb-2">
                Student Dashboard
              </h1>
              <p className="text-text-secondary">
                Track your tests and performance
              </p>
            </div>
            <div className="w-16 h-16 bg-linear-to-br from-primary to-secondary rounded-full flex items-center justify-center">
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
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-text-secondary">
                Available Tests
              </h3>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-text">{pendingTests}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-text-secondary">
                Completed Tests
              </h3>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-text">{completedTests}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-text-secondary">
                Average Score
              </h3>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-text">
              {percentage.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Available Tests */}
        <div className="bg-white rounded-lg shadow-sm border border-border">
          <div className="px-6 py-4 border-b border-border bg-linear-to-r from-blue-50 to-blue-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-text">Available Tests</h2>
                <p className="text-sm text-text-secondary">
                  {availableTests.length} tests ready to take
                </p>
              </div>
            </div>
          </div>

          {testsError ? (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {testsError}
              </div>
            </div>
          ) : availableTests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {availableTests.map((test) => {
                return (
                  <div
                    key={test.id}
                    className="bg-surface rounded-lg border border-border hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-bold text-text line-clamp-2">
                          {test.title}
                        </h3>
                        <span className="ml-2 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full whitespace-nowrap">
                          Active
                        </span>
                      </div>

                      <p className="text-sm text-text-secondary mb-4 line-clamp-2">
                        {test.description}
                      </p>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-text-secondary">
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span>
                            Until {new Date(test.endTime).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center text-sm font-semibold text-primary">
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                            />
                          </svg>
                          <span>{test.totalMarks} Marks</span>
                        </div>
                        <div className="flex items-center text-sm text-text-secondary">
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>
                            {test.maxAttempts}{" "}
                            {test.maxAttempts === 1 ? "Attempt" : "Attempts"}
                          </span>
                        </div>
                      </div>

                      {(() => {
                        const testAttempts = myResults.filter(r => r.test.id === test.id);
                        const attemptsUsed = testAttempts.length;
                        const maxAttempts = test.maxAttempts;
                        const currentAttempt = testAttempts.find(r => !r.completed);

                        // Logic:
                        // 1. If active attempt exists -> Resume
                        // 2. If no active attempt:
                        //    a. If attempts check passed -> "Start Test" (or "Retake Test" if >0 previous)
                        //    b. If attempts exhausted -> "Maximum Attempts Reached"

                        if (currentAttempt) {
                          return (
                            <button
                              onClick={() => handleResumeTest(test)}
                              className="w-full px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Resume Test</span>
                            </button>
                          );
                        }

                        if (attemptsUsed >= maxAttempts) {
                          return (
                            <button
                              disabled
                              className="w-full px-4 py-3 bg-gray-200 text-gray-500 font-semibold rounded-lg flex items-center justify-center space-x-2 cursor-not-allowed"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <span>Max Attempts Reached ({attemptsUsed}/{maxAttempts})</span>
                            </button>
                          );
                        }

                        // Check Time Window
                        const now = new Date();
                        const start = test.startTime ? new Date(test.startTime) : null;
                        const end = test.endTime ? new Date(test.endTime) : null;

                        if (start && now < start) {
                          return (
                            <button
                              disabled
                              className="w-full px-4 py-3 bg-blue-100 text-blue-700 font-semibold rounded-lg flex items-center justify-center space-x-2 cursor-not-allowed"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Starts: {start.toLocaleDateString()} {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </button>
                          );
                        }

                        if (end && now > end) {
                          return (
                            <button
                              disabled
                              className="w-full px-4 py-3 bg-gray-100 text-gray-500 font-semibold rounded-lg flex items-center justify-center space-x-2 cursor-not-allowed"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Test Ended</span>
                            </button>
                          );
                        }

                        return (
                          <button
                            onClick={() => handleStartTest(test)}
                            className="w-full px-4 py-3 bg-primary hover:bg-secondary text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>{attemptsUsed > 0 ? "Retake Test" : "Start Test"}</span>
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-text-secondary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-text mb-2">
                No Tests Available
              </h3>
              <p className="text-text-secondary">
                Check back later for new tests
              </p>
            </div>
          )}
        </div>

        {/* My Results */}
        <div className="bg-white rounded-lg shadow-sm border border-border">
          <div className="px-6 py-4 border-b border-border bg-linear-to-r from-purple-50 to-purple-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-text">My Results</h2>
                <p className="text-sm text-text-secondary">
                  {myResults.filter((r) => r.completed).length} test
                  {myResults.filter((r) => r.completed).length !== 1
                    ? "s"
                    : ""}{" "}
                  completed
                </p>
              </div>
            </div>
          </div>

          {resultsError ? (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {resultsError}
              </div>
            </div>
          ) : myResults.filter((r) => r.completed).length > 0 ? (
            <div className="divide-y divide-border">
              {myResults
                .filter((r) => r.completed)
                .map((result, index) => {
                  const percentage =
                    (result.score / result.test.totalMarks) * 100;
                  const isValid = result.isValidTest !== false;

                  return (
                    <div
                      key={index}
                      className="p-6 hover:bg-surface transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-text">
                              {result.test.title}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${isValid
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                                }`}
                            >
                              {isValid ? "Valid" : "Invalid"}
                            </span>
                          </div>

                          <div className="flex items-center space-x-6 text-sm text-text-secondary">
                            <div className="flex items-center">
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              {result.submittedAt &&
                                new Date(
                                  result.submittedAt
                                ).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              {result.submittedAt &&
                                new Date(
                                  result.submittedAt
                                ).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>

                        <div className="ml-6 flex flex-col items-end">
                          <div className="text-3xl font-bold text-primary mb-1">
                            {percentage.toFixed(1)}%
                          </div>
                          <div className="text-sm text-text-secondary">
                            {result.score}/{result.test.totalMarks} marks
                          </div>
                          <div className="mt-2 w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${percentage >= 75
                                ? "bg-green-500"
                                : percentage >= 50
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                                }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-text-secondary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-text mb-2">
                No Results Yet
              </h3>
              <p className="text-text-secondary">
                Complete a test to see your results here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
