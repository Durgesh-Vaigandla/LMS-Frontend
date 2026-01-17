import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { testApi } from "../../../../services/testApi";
import type { Question, Test } from "../../../../types";
import dummyQuestions from "../../../../data/dummyQuestions.json";

const QuestionManagementPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const [testResponse, questionsResponse] = await Promise.all([
          testApi.getMyTests(),
          testApi.getQuestions(parseInt(id)),
        ]);

        if (testResponse.success && testResponse.data) {
          const foundTest = testResponse.data.find(t => t.id === parseInt(id));
          setTest(foundTest || null);
        }

        if (questionsResponse.success && questionsResponse.data) {
          setQuestions(questionsResponse.data);
        } else {
          setError(questionsResponse.message);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      const response = await testApi.deleteQuestion(questionId);
      if (response.success) {
        setQuestions(questions.filter(q => q.id !== questionId));
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete question");
    }
  };

  const handleCreateQuestionSuccess = () => {
    setShowCreateForm(false);
    // Refresh questions
    if (id) {
      testApi.getQuestions(parseInt(id)).then(response => {
        if (response.success && response.data) {
          setQuestions(response.data);
        }
      });
    }
  };

  const handleEditQuestionSuccess = () => {
    setEditingQuestion(null);
    // Refresh questions
    if (id) {
      testApi.getQuestions(parseInt(id)).then(response => {
        if (response.success && response.data) {
          setQuestions(response.data);
        }
      });
    }
  };

  const handleImportDummyQuestions = async () => {
    if (!id) return;
    
    if (!confirm(`This will import ${dummyQuestions.length} dummy questions. Continue?`)) return;

    setImporting(true);
    setError(null);
    setImportProgress({ current: 0, total: dummyQuestions.length });

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < dummyQuestions.length; i++) {
      const question = dummyQuestions[i];
      setImportProgress({ current: i + 1, total: dummyQuestions.length });

      try {
        const response = await testApi.createQuestion(parseInt(id), question as any);
        if (response.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (err: any) {
        errorCount++;
      }
    }

    setImporting(false);
    
    // Refresh questions list
    const questionsResponse = await testApi.getQuestions(parseInt(id));
    if (questionsResponse.success && questionsResponse.data) {
      setQuestions(questionsResponse.data);
    }

    if (errorCount > 0) {
      setError(`Import completed with ${successCount} successful and ${errorCount} failed questions.`);
    } else {
      alert(`Successfully imported ${successCount} questions!`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-text">Loading questions...</div>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-accent">{error || "Test not found"}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text">
              Manage Questions
            </h1>
            <p className="text-text-secondary">Test: {test.title}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/dashboard/tests/${id}`}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Back to Test
            </Link>
            <button
              onClick={() => setShowCreateForm(true)}
              disabled={importing}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              Add Question
            </button>
            <button
              onClick={handleImportDummyQuestions}
              disabled={importing}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {importing ? `Importing... (${importProgress.current}/${importProgress.total})` : 'Import Dummy Questions'}
            </button>
          </div>
        </div>

        {/* Questions List */}
        <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-border">
            <h2 className="text-lg font-semibold text-text">
              Questions ({questions.length})
            </h2>
          </div>
          {questions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Question
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Marks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-border">
                  {questions.map((question, index) => (
                    <tr key={question.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {question.questionType === "MCQ" ? "Multiple Choice (Single)" :
                         question.questionType === "MAQ" ? "Multiple Choice (Multiple)" :
                         "Fill in the Blank"}
                      </td>
                      <td className="px-6 py-4 text-sm text-text max-w-md">
                        <div className="truncate" title={question.questionText}>
                          {question.questionText}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {question.marks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary space-x-2">
                        <button
                          onClick={() => setEditingQuestion(question)}
                          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(question.id)}
                          className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
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
              No questions added yet. Click "Add Question" to get started.
            </div>
          )}
        </div>
      </div>

      {showCreateForm && (
        <CreateQuestionModal
          testId={parseInt(id!)}
          onSuccess={handleCreateQuestionSuccess}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {editingQuestion && (
        <EditQuestionModal
          question={editingQuestion}
          onSuccess={handleEditQuestionSuccess}
          onCancel={() => setEditingQuestion(null)}
        />
      )}
    </div>
  );
};

// Create Question Modal Component
const CreateQuestionModal: React.FC<{
  testId: number;
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ testId, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    questionText: "",
    questionType: "MCQ" as "MCQ" | "MAQ" | "FILL_BLANK",
    marks: 1,
    negativeMarks: 0,
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctOption: "",
    correctOptionsCsv: "",
    correctAnswer: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const questionData = {
        questionType: formData.questionType,
        questionText: formData.questionText,
        marks: formData.marks,
        negativeMarks: formData.negativeMarks,
        ...(formData.questionType === "MCQ" && {
          optionA: formData.optionA,
          optionB: formData.optionB,
          optionC: formData.optionC,
          optionD: formData.optionD,
          correctOption: formData.correctOption,
        }),
        ...(formData.questionType === "MAQ" && {
          optionA: formData.optionA,
          optionB: formData.optionB,
          optionC: formData.optionC,
          optionD: formData.optionD,
          correctOptionsCsv: formData.correctOptionsCsv,
        }),
        ...(formData.questionType === "FILL_BLANK" && {
          correctAnswer: formData.correctAnswer,
        }),
      };

      const response = await testApi.createQuestion(testId, questionData);
      if (response.success) {
        onSuccess();
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create question");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-text mb-4">Add Question</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Question Type
              </label>
              <select
                value={formData.questionType}
                onChange={(e) => setFormData({
                  ...formData,
                  questionType: e.target.value as "MCQ" | "MAQ" | "FILL_BLANK"
                })}
                className="w-full p-2 border border-border rounded-md"
                required
              >
                <option value="MCQ">Multiple Choice (Single Correct)</option>
                <option value="MAQ">Multiple Choice (Multiple Correct)</option>
                <option value="FILL_BLANK">Fill in the Blank</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Question Text
              </label>
              <textarea
                value={formData.questionText}
                onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                className="w-full p-2 border border-border rounded-md"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Marks
                </label>
                <input
                  type="number"
                  value={formData.marks}
                  onChange={(e) => setFormData({ ...formData, marks: parseInt(e.target.value) })}
                  className="w-full p-2 border border-border rounded-md"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Negative Marks
                </label>
                <input
                  type="number"
                  value={formData.negativeMarks}
                  onChange={(e) => setFormData({ ...formData, negativeMarks: parseInt(e.target.value) })}
                  className="w-full p-2 border border-border rounded-md"
                  min="0"
                  required
                />
              </div>
            </div>

            {(formData.questionType === "MCQ" || formData.questionType === "MAQ") && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Options
                </label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 text-sm font-medium">A:</span>
                    <input
                      type="text"
                      value={formData.optionA}
                      onChange={(e) => setFormData({ ...formData, optionA: e.target.value })}
                      className="flex-1 p-2 border border-border rounded-md"
                      placeholder="Option A"
                      required
                    />
                    {formData.questionType === "MCQ" && (
                      <input
                        type="radio"
                        name="correctOption"
                        value="A"
                        checked={formData.correctOption === "A"}
                        onChange={(e) => setFormData({ ...formData, correctOption: e.target.value })}
                        required
                      />
                    )}
                    {formData.questionType === "MAQ" && (
                      <input
                        type="checkbox"
                        checked={formData.correctOptionsCsv.includes("A")}
                        onChange={() => {
                          const current = formData.correctOptionsCsv.split(",").filter(x => x);
                          const newValue = current.includes("A")
                            ? current.filter(x => x !== "A")
                            : [...current, "A"];
                          setFormData({ ...formData, correctOptionsCsv: newValue.join(",") });
                        }}
                      />
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-6 text-sm font-medium">B:</span>
                    <input
                      type="text"
                      value={formData.optionB}
                      onChange={(e) => setFormData({ ...formData, optionB: e.target.value })}
                      className="flex-1 p-2 border border-border rounded-md"
                      placeholder="Option B"
                      required
                    />
                    {formData.questionType === "MCQ" && (
                      <input
                        type="radio"
                        name="correctOption"
                        value="B"
                        checked={formData.correctOption === "B"}
                        onChange={(e) => setFormData({ ...formData, correctOption: e.target.value })}
                        required
                      />
                    )}
                    {formData.questionType === "MAQ" && (
                      <input
                        type="checkbox"
                        checked={formData.correctOptionsCsv.includes("B")}
                        onChange={() => {
                          const current = formData.correctOptionsCsv.split(",").filter(x => x);
                          const newValue = current.includes("B")
                            ? current.filter(x => x !== "B")
                            : [...current, "B"];
                          setFormData({ ...formData, correctOptionsCsv: newValue.join(",") });
                        }}
                      />
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-6 text-sm font-medium">C:</span>
                    <input
                      type="text"
                      value={formData.optionC}
                      onChange={(e) => setFormData({ ...formData, optionC: e.target.value })}
                      className="flex-1 p-2 border border-border rounded-md"
                      placeholder="Option C"
                      required
                    />
                    {formData.questionType === "MCQ" && (
                      <input
                        type="radio"
                        name="correctOption"
                        value="C"
                        checked={formData.correctOption === "C"}
                        onChange={(e) => setFormData({ ...formData, correctOption: e.target.value })}
                        required
                      />
                    )}
                    {formData.questionType === "MAQ" && (
                      <input
                        type="checkbox"
                        checked={formData.correctOptionsCsv.includes("C")}
                        onChange={() => {
                          const current = formData.correctOptionsCsv.split(",").filter(x => x);
                          const newValue = current.includes("C")
                            ? current.filter(x => x !== "C")
                            : [...current, "C"];
                          setFormData({ ...formData, correctOptionsCsv: newValue.join(",") });
                        }}
                      />
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-6 text-sm font-medium">D:</span>
                    <input
                      type="text"
                      value={formData.optionD}
                      onChange={(e) => setFormData({ ...formData, optionD: e.target.value })}
                      className="flex-1 p-2 border border-border rounded-md"
                      placeholder="Option D"
                      required
                    />
                    {formData.questionType === "MCQ" && (
                      <input
                        type="radio"
                        name="correctOption"
                        value="D"
                        checked={formData.correctOption === "D"}
                        onChange={(e) => setFormData({ ...formData, correctOption: e.target.value })}
                        required
                      />
                    )}
                    {formData.questionType === "MAQ" && (
                      <input
                        type="checkbox"
                        checked={formData.correctOptionsCsv.includes("D")}
                        onChange={() => {
                          const current = formData.correctOptionsCsv.split(",").filter(x => x);
                          const newValue = current.includes("D")
                            ? current.filter(x => x !== "D")
                            : [...current, "D"];
                          setFormData({ ...formData, correctOptionsCsv: newValue.join(",") });
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {formData.questionType === "FILL_BLANK" && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Correct Answer
                </label>
                <input
                  type="text"
                  value={formData.correctAnswer}
                  onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                  className="w-full p-2 border border-border rounded-md"
                  placeholder="Enter the correct answer"
                  required
                />
                <p className="text-xs text-text-secondary mt-1">
                  Note: Answer comparison is case-insensitive and ignores spaces/dashes/underscores
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-text-secondary hover:text-text"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Question"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Edit Question Modal Component
const EditQuestionModal: React.FC<{
  question: Question;
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ question, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    questionText: question.questionText,
    questionType: question.questionType,
    marks: question.marks,
    negativeMarks: question.negativeMarks || 0,
    optionA: question.optionA || "",
    optionB: question.optionB || "",
    optionC: question.optionC || "",
    optionD: question.optionD || "",
    correctOption: question.correctOption || "",
    correctOptionsCsv: question.correctOptionsCsv || "",
    correctAnswer: question.correctAnswer || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const questionData = {
        questionType: formData.questionType,
        questionText: formData.questionText,
        marks: formData.marks,
        negativeMarks: formData.negativeMarks,
        ...(formData.questionType === "MCQ" && {
          optionA: formData.optionA,
          optionB: formData.optionB,
          optionC: formData.optionC,
          optionD: formData.optionD,
          correctOption: formData.correctOption,
        }),
        ...(formData.questionType === "MAQ" && {
          optionA: formData.optionA,
          optionB: formData.optionB,
          optionC: formData.optionC,
          optionD: formData.optionD,
          correctOptionsCsv: formData.correctOptionsCsv,
        }),
        ...(formData.questionType === "FILL_BLANK" && {
          correctAnswer: formData.correctAnswer,
        }),
      };

      const response = await testApi.updateQuestion(question.id, questionData);
      if (response.success) {
        onSuccess();
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update question");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-text mb-4">Edit Question</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Question Type
              </label>
              <select
                value={formData.questionType}
                onChange={(e) => setFormData({
                  ...formData,
                  questionType: e.target.value as "MCQ" | "MAQ" | "FILL_BLANK"
                })}
                className="w-full p-2 border border-border rounded-md"
                required
              >
                <option value="MCQ">Multiple Choice (Single Correct)</option>
                <option value="MAQ">Multiple Choice (Multiple Correct)</option>
                <option value="FILL_BLANK">Fill in the Blank</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Question Text
              </label>
              <textarea
                value={formData.questionText}
                onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                className="w-full p-2 border border-border rounded-md"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Marks
                </label>
                <input
                  type="number"
                  value={formData.marks}
                  onChange={(e) => setFormData({ ...formData, marks: parseInt(e.target.value) })}
                  className="w-full p-2 border border-border rounded-md"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Negative Marks
                </label>
                <input
                  type="number"
                  value={formData.negativeMarks}
                  onChange={(e) => setFormData({ ...formData, negativeMarks: parseInt(e.target.value) })}
                  className="w-full p-2 border border-border rounded-md"
                  min="0"
                  required
                />
              </div>
            </div>

            {(formData.questionType === "MCQ" || formData.questionType === "MAQ") && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Options
                </label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 text-sm font-medium">A:</span>
                    <input
                      type="text"
                      value={formData.optionA}
                      onChange={(e) => setFormData({ ...formData, optionA: e.target.value })}
                      className="flex-1 p-2 border border-border rounded-md"
                      placeholder="Option A"
                      required
                    />
                    {formData.questionType === "MCQ" && (
                      <input
                        type="radio"
                        name="correctOption"
                        value="A"
                        checked={formData.correctOption === "A"}
                        onChange={(e) => setFormData({ ...formData, correctOption: e.target.value })}
                        required
                      />
                    )}
                    {formData.questionType === "MAQ" && (
                      <input
                        type="checkbox"
                        checked={formData.correctOptionsCsv.includes("A")}
                        onChange={() => {
                          const current = formData.correctOptionsCsv.split(",").filter(x => x);
                          const newValue = current.includes("A")
                            ? current.filter(x => x !== "A")
                            : [...current, "A"];
                          setFormData({ ...formData, correctOptionsCsv: newValue.join(",") });
                        }}
                      />
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-6 text-sm font-medium">B:</span>
                    <input
                      type="text"
                      value={formData.optionB}
                      onChange={(e) => setFormData({ ...formData, optionB: e.target.value })}
                      className="flex-1 p-2 border border-border rounded-md"
                      placeholder="Option B"
                      required
                    />
                    {formData.questionType === "MCQ" && (
                      <input
                        type="radio"
                        name="correctOption"
                        value="B"
                        checked={formData.correctOption === "B"}
                        onChange={(e) => setFormData({ ...formData, correctOption: e.target.value })}
                        required
                      />
                    )}
                    {formData.questionType === "MAQ" && (
                      <input
                        type="checkbox"
                        checked={formData.correctOptionsCsv.includes("B")}
                        onChange={() => {
                          const current = formData.correctOptionsCsv.split(",").filter(x => x);
                          const newValue = current.includes("B")
                            ? current.filter(x => x !== "B")
                            : [...current, "B"];
                          setFormData({ ...formData, correctOptionsCsv: newValue.join(",") });
                        }}
                      />
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-6 text-sm font-medium">C:</span>
                    <input
                      type="text"
                      value={formData.optionC}
                      onChange={(e) => setFormData({ ...formData, optionC: e.target.value })}
                      className="flex-1 p-2 border border-border rounded-md"
                      placeholder="Option C"
                      required
                    />
                    {formData.questionType === "MCQ" && (
                      <input
                        type="radio"
                        name="correctOption"
                        value="C"
                        checked={formData.correctOption === "C"}
                        onChange={(e) => setFormData({ ...formData, correctOption: e.target.value })}
                        required
                      />
                    )}
                    {formData.questionType === "MAQ" && (
                      <input
                        type="checkbox"
                        checked={formData.correctOptionsCsv.includes("C")}
                        onChange={() => {
                          const current = formData.correctOptionsCsv.split(",").filter(x => x);
                          const newValue = current.includes("C")
                            ? current.filter(x => x !== "C")
                            : [...current, "C"];
                          setFormData({ ...formData, correctOptionsCsv: newValue.join(",") });
                        }}
                      />
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-6 text-sm font-medium">D:</span>
                    <input
                      type="text"
                      value={formData.optionD}
                      onChange={(e) => setFormData({ ...formData, optionD: e.target.value })}
                      className="flex-1 p-2 border border-border rounded-md"
                      placeholder="Option D"
                      required
                    />
                    {formData.questionType === "MCQ" && (
                      <input
                        type="radio"
                        name="correctOption"
                        value="D"
                        checked={formData.correctOption === "D"}
                        onChange={(e) => setFormData({ ...formData, correctOption: e.target.value })}
                        required
                      />
                    )}
                    {formData.questionType === "MAQ" && (
                      <input
                        type="checkbox"
                        checked={formData.correctOptionsCsv.includes("D")}
                        onChange={() => {
                          const current = formData.correctOptionsCsv.split(",").filter(x => x);
                          const newValue = current.includes("D")
                            ? current.filter(x => x !== "D")
                            : [...current, "D"];
                          setFormData({ ...formData, correctOptionsCsv: newValue.join(",") });
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {formData.questionType === "FILL_BLANK" && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Correct Answer
                </label>
                <input
                  type="text"
                  value={formData.correctAnswer}
                  onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                  className="w-full p-2 border border-border rounded-md"
                  placeholder="Enter the correct answer"
                  required
                />
                <p className="text-xs text-text-secondary mt-1">
                  Note: Answer comparison is case-insensitive and ignores spaces/dashes/underscores
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-text-secondary hover:text-text"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update Question"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QuestionManagementPage;