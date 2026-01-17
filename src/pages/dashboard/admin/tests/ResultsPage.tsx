import React, { useEffect, useState } from "react";
import { testApi } from "../../../../services/testApi";
import type { Result } from "../../../../types";

const ResultsPage: React.FC = () => {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const response = await testApi.getAdminResults();
        if (response.success && response.data) {
          setResults(response.data);
        } else {
          setError(response.message);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load results");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  const handleDeleteResult = async (resultId: number) => {
    if (!confirm("Are you sure you want to delete this result?")) return;
    try {
      const response = await testApi.deleteResult(resultId);
      if (response.success) {
        setResults(results.filter(r => r.id !== resultId));
      } else {
        alert(response.message || "Failed to delete result");
      }
    } catch (err: any) {
      alert("Failed to delete result");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-text">Loading results...</div>
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
            Test Results
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
          {results.length > 0 ? (
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
                      Percentage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Submitted At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-border">
                  {results.map((result) => (
                    <tr key={result.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text">
                        {result.test.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {result.student.name} ({result.student.email})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {result.score}/{result.test.totalMarks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {(
                          (result.score / result.test.totalMarks) *
                          100
                        ).toFixed(2)}
                        %
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {new Date(result.submittedAt || "").toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {result.isValidTest ? "Valid" : "Invalid"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        <button
                          onClick={() => handleDeleteResult(result.id)}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          Delete
                        </button>
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

export default ResultsPage;
