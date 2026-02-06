import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { testApi } from "../../../services/testApi";
import type { Test, Result } from "../../../types";

const AdminDashboard: React.FC = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [testsResponse, resultsResponse] = await Promise.all([
          testApi.getMyTests(),
          testApi.getAdminResults(),
        ]);

        if (testsResponse.success && testsResponse.data) {
          setTests(testsResponse.data);
        } else {
          setError(testsResponse.message);
        }

        if (resultsResponse.success && resultsResponse.data) {
          setResults(resultsResponse.data);
        } else {
          setError(resultsResponse.message);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-text">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-accent">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-text">
            Admin Dashboard
          </h1>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Link
            to="/dashboard/tests"
            className="bg-white rounded-lg shadow-sm border border-border p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-text mb-2">
              Manage Tests
            </h3>
            <p className="text-text-secondary mb-4">
              Create, edit, and publish tests
            </p>
            <div className="text-2xl font-bold text-primary">
              {tests.length}
            </div>
            <div className="text-sm text-text-secondary">Tests created</div>
          </Link>

          <Link
            to="/dashboard/tests"
            className="bg-white rounded-lg shadow-sm border border-border p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-text mb-2">Questions</h3>
            <p className="text-text-secondary mb-4">Add and manage questions</p>
            <div className="text-2xl font-bold text-secondary">
              {tests.reduce(
                (acc, test) => acc + (test as any).questionCount || 0,
                0
              )}
            </div>
            <div className="text-sm text-text-secondary">Total questions</div>
          </Link>

          <Link
            to="/dashboard/results"
            className="bg-white rounded-lg shadow-sm border border-border p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-text mb-2">Results</h3>
            <p className="text-text-secondary mb-4">View student performance</p>
            <div className="text-2xl font-bold text-primary">
              {results.length}
            </div>
            <div className="text-sm text-text-secondary">Total attempts</div>
          </Link>

          <Link
            to="/dashboard/proctoring-test"
            className="bg-white rounded-lg shadow-sm border border-border p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-text mb-2">Proctoring Test</h3>
            <p className="text-text-secondary mb-4">Validate camera + AI model</p>
            <div className="text-2xl font-bold text-secondary">Lab</div>
            <div className="text-sm text-text-secondary">Diagnostics</div>
          </Link>
        </div>

        {/* Recent Tests */}
        <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-border flex justify-between items-center">
            <h2 className="text-lg font-semibold text-text">Recent Tests</h2>
            <Link
              to="/dashboard/tests"
              className="text-primary hover:text-secondary text-sm font-medium"
            >
              View all →
            </Link>
          </div>
          {tests.slice(0, 5).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Start Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Published
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-border">
                  {tests.slice(0, 5).map((test) => (
                    <tr key={test.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text">
                        {test.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {new Date(test.startTime).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {test.published ? "Yes" : "No"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        <Link
                          to={`/dashboard/tests/${test.id}`}
                          className="text-primary hover:text-secondary"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 text-center text-text-secondary">
              No tests created yet.{" "}
              <Link to="/dashboard/tests/create" className="text-primary">
                Create your first test
              </Link>
            </div>
          )}
        </div>

        {/* Recent Results */}
        <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-border flex justify-between items-center">
            <h2 className="text-lg font-semibold text-text">Recent Results</h2>
            <Link
              to="/dashboard/results"
              className="text-primary hover:text-secondary text-sm font-medium"
            >
              View all →
            </Link>
          </div>
          {results.slice(0, 5).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Test Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Submitted At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-border">
                  {results.slice(0, 5).map((result) => (
                    <tr key={result.test.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text">
                        {result.test.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {result.student.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {result.score}/{result.test.totalMarks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {new Date(result.submittedAt || "").toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 text-center text-text-secondary">
              No results yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
