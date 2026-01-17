import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { testApi } from "../../../../services/testApi";
import type { Test, Question, QuestionTypeType } from "../../../../types";
import dummyQuestions from "../../../../data/dummyQuestions.json";

const TestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    fetchData();
  }, [id]);

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
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load test details");
    } finally {
      setLoading(false);
    }
  };

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

  const handleDeleteTest = async () => {
    if (!test || !confirm("Are you sure you want to delete this test? This will also delete all questions and results associated with it.")) return;

    try {
      setLoading(true);
      const response = await testApi.deleteTest(test.id);
      if (response.success) {
        navigate('/dashboard/tests');
      } else {
        setError(response.message || "Failed to delete test");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Delete test error:", err);
      // Even if API fails, if it's 200 OK it might be success
      if (err.response?.status === 200) {
        navigate('/dashboard/tests');
      } else {
        setError(err.response?.data?.message || "Failed to delete test");
        setLoading(false);
      }
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
    await fetchData();

    if (errorCount > 0) {
      setError(`Import completed with ${successCount} successful and ${errorCount} failed questions.`);
    } else {
      alert(`Successfully imported ${successCount} questions!`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-secondary font-medium">Loading test...</p>
        </div>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg border border-red-200 p-8 max-w-md">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-text">Test Not Found</h3>
          </div>
          <p className="text-text-secondary mb-6">{error || "The test you're looking for doesn't exist."}</p>
          <button
            onClick={() => navigate('/dashboard/tests')}
            className="w-full px-4 py-2 bg-primary hover:bg-secondary text-white font-semibold rounded-lg transition-colors"
          >
            Back to Tests
          </button>
        </div>
      </div>
    );
  }

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  return (
    <div className="min-h-screen bg-surface">
      {/* Fixed Header */}
      <div className="bg-white border-b border-border shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard/tests')}
                className="p-2 hover:bg-surface rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-text">{test.title}</h1>
                <p className="text-sm text-text-secondary">{questions.length} questions · {totalMarks} marks</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${test.published ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                }`}>
                {test.published ? 'Published' : 'Draft'}
              </span>
              <button className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text hover:bg-surface rounded-lg transition-colors">
                Edit Test
              </button>
              <button
                onClick={handleDeleteTest}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete Test
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Test Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Test Details Card */}
            <div className="bg-white rounded-lg shadow-sm border border-border p-6 sticky top-24">
              <h3 className="text-lg font-bold text-text mb-4">Test Information</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Description</label>
                  <p className="text-sm text-text mt-1">{test.description || 'No description provided'}</p>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Total Marks</label>
                      <p className="text-2xl font-bold text-primary mt-1">{test.totalMarks}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Questions</label>
                      <p className="text-2xl font-bold text-primary mt-1">{questions.length}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Duration</label>
                  <p className="text-sm text-text mt-1">
                    <span className="block">{new Date(test.startTime).toLocaleDateString()} {new Date(test.startTime).toLocaleTimeString()}</span>
                    <span className="text-text-secondary">to</span>
                    <span className="block">{new Date(test.endTime).toLocaleDateString()} {new Date(test.endTime).toLocaleTimeString()}</span>
                  </p>
                </div>

                <div className="pt-4 border-t border-border">
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Max Attempts</label>
                  <p className="text-sm text-text mt-1">{test.maxAttempts} {test.maxAttempts === 1 ? 'attempt' : 'attempts'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Questions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Add Question Button */}
            <div className="bg-gradient-to-r from-primary to-secondary rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-1">Questions Bank</h2>
                  <p className="text-red-100 text-sm">Create and manage your test questions</p>
                </div>
                <button
                  onClick={() => {
                    setEditingQuestion(null);
                    setShowQuestionForm(true);
                  }}
                  disabled={importing}
                  className="px-6 py-3 bg-white text-primary hover:bg-red-50 font-semibold rounded-lg shadow-md transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Question</span>
                </button>
                <button
                  onClick={handleImportDummyQuestions}
                  disabled={importing}
                  className="px-6 py-3 bg-white text-primary hover:bg-red-50 font-semibold rounded-lg shadow-md transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
                >
                  {importing ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Importing... ({importProgress.current}/{importProgress.total})</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span>Import Dummy Questions</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Questions List */}
            {questions.length > 0 ? (
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div key={question.id} className="bg-white rounded-lg shadow-sm border border-border hover:shadow-md transition-all">
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <span className="flex items-center justify-center w-10 h-10 bg-primary text-white text-lg font-bold rounded-lg">
                              {index + 1}
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${question.questionType === 'MCQ' ? 'bg-blue-100 text-blue-700' :
                                question.questionType === 'MAQ' ? 'bg-purple-100 text-purple-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                {question.questionType === 'MCQ' ? 'Single Choice' :
                                  question.questionType === 'MAQ' ? 'Multiple Choice' : 'Fill in Blank'}
                              </span>
                              <div className="flex items-center space-x-1 text-sm">
                                <span className="font-semibold text-primary">{question.marks}</span>
                                <span className="text-text-secondary">marks</span>
                                {question.negativeMarks > 0 && (
                                  <>
                                    <span className="text-text-secondary">·</span>
                                    <span className="text-red-600">-{question.negativeMarks}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <p className="text-text font-medium text-lg mb-4">{question.questionText}</p>

                          {/* Options Display */}
                          {(question.questionType === 'MCQ' || question.questionType === 'MAQ') && (
                            <div className="space-y-2 ml-13">
                              {['A', 'B', 'C', 'D'].map((opt) => {
                                const optionText = question[`option${opt}` as keyof Question];
                                if (!optionText) return null;

                                const isCorrect = question.questionType === 'MCQ'
                                  ? question.correctOption === opt
                                  : question.correctOptionsCsv?.includes(opt);

                                return (
                                  <div key={opt} className={`flex items-center space-x-3 p-3 rounded-lg ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-surface'
                                    }`}>
                                    <span className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${isCorrect ? 'bg-green-500 text-white' : 'bg-white text-text-secondary border border-border'
                                      }`}>
                                      {opt}
                                    </span>
                                    <span className={`flex-1 ${isCorrect ? 'font-medium text-green-900' : 'text-text'}`}>
                                      {optionText}
                                    </span>
                                    {isCorrect && (
                                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {question.questionType === 'FILL_BLANK' && (
                            <div className="ml-13 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <span className="text-sm font-semibold text-green-900">Answer: </span>
                              <span className="text-sm text-green-700">{question.correctAnswer}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => {
                              setEditingQuestion(question);
                              setShowQuestionForm(true);
                            }}
                            className="p-2 text-text-secondary hover:text-primary hover:bg-red-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(question.id)}
                            className="p-2 text-text-secondary hover:text-primary hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-border p-12 text-center">
                <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-text mb-2">No Questions Yet</h3>
                <p className="text-text-secondary mb-6">Start building your test by adding questions</p>
                <button
                  onClick={() => {
                    setEditingQuestion(null);
                    setShowQuestionForm(true);
                  }}
                  className="inline-flex items-center justify-center px-6 py-3 bg-primary hover:bg-secondary text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Your First Question
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Question Form Modal */}
      {showQuestionForm && (
        <QuestionFormModal
          testId={parseInt(id!)}
          question={editingQuestion}
          onSuccess={() => {
            setShowQuestionForm(false);
            setEditingQuestion(null);
            fetchData();
          }}
          onCancel={() => {
            setShowQuestionForm(false);
            setEditingQuestion(null);
          }}
        />
      )}
    </div>
  );
};

// Question Form Modal Component
const QuestionFormModal: React.FC<{
  testId: number;
  question: Question | null;
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ testId, question, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    questionText: question?.questionText || "",
    questionType: (question?.questionType || "MCQ") as QuestionTypeType,
    marks: question?.marks || 1,
    negativeMarks: question?.negativeMarks || 0,
    optionA: question?.optionA || "",
    optionB: question?.optionB || "",
    optionC: question?.optionC || "",
    optionD: question?.optionD || "",
    correctOption: question?.correctOption || "",
    correctOptionsCsv: question?.correctOptionsCsv || "",
    correctAnswer: question?.correctAnswer || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const questionData: any = {
        questionType: formData.questionType,
        questionText: formData.questionText,
        marks: formData.marks,
        negativeMarks: formData.negativeMarks,
      };

      if (formData.questionType === "MCQ") {
        questionData.optionA = formData.optionA;
        questionData.optionB = formData.optionB;
        questionData.optionC = formData.optionC;
        questionData.optionD = formData.optionD;
        questionData.correctOption = formData.correctOption;
      } else if (formData.questionType === "MAQ") {
        questionData.optionA = formData.optionA;
        questionData.optionB = formData.optionB;
        questionData.optionC = formData.optionC;
        questionData.optionD = formData.optionD;
        questionData.correctOptionsCsv = formData.correctOptionsCsv;
      } else {
        questionData.correctAnswer = formData.correctAnswer;
      }

      const response = question
        ? await testApi.updateQuestion(question.id, questionData)
        : await testApi.createQuestion(testId, questionData);

      if (response.success) {
        onSuccess();
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${question ? 'update' : 'create'} question`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full my-8">
        <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-primary to-secondary">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{question ? 'Edit Question' : 'Add New Question'}</h2>
                <p className="text-red-100 text-sm">Fill in the details below</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-primary font-medium">{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-text mb-2">
              Question Type <span className="text-primary">*</span>
            </label>
            <select
              value={formData.questionType}
              onChange={(e) => setFormData({
                ...formData,
                questionType: e.target.value as QuestionTypeType,
                correctOption: "",
                correctOptionsCsv: "",
                correctAnswer: "",
              })}
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              required
              disabled={!!question}
            >
              <option value="MCQ">Multiple Choice (Single Correct Answer)</option>
              <option value="MAQ">Multiple Answer Question (Multiple Correct)</option>
              <option value="FILL_BLANK">Fill in the Blank</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text mb-2">
              Question Text <span className="text-primary">*</span>
            </label>
            <textarea
              value={formData.questionText}
              onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
              rows={4}
              placeholder="Enter your question here..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-text mb-2">
                Marks <span className="text-primary">*</span>
              </label>
              <input
                type="number"
                value={formData.marks}
                onChange={(e) => setFormData({ ...formData, marks: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                min="1"
                placeholder="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text mb-2">
                Negative Marks
              </label>
              <input
                type="number"
                value={formData.negativeMarks}
                onChange={(e) => setFormData({ ...formData, negativeMarks: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                min="0"
                placeholder="0"
                required
              />
            </div>
          </div>

          {(formData.questionType === "MCQ" || formData.questionType === "MAQ") && (
            <div>
              <label className="block text-sm font-semibold text-text mb-3">
                Options <span className="text-primary">*</span>
              </label>
              <div className="space-y-3">
                {['A', 'B', 'C', 'D'].map((opt) => (
                  <div key={opt} className="flex items-center space-x-3">
                    <span className="flex items-center justify-center w-10 h-10 bg-surface text-text font-bold rounded-lg">
                      {opt}
                    </span>
                    <input
                      type="text"
                      value={formData[`option${opt}` as keyof typeof formData] as string}
                      onChange={(e) => setFormData({ ...formData, [`option${opt}`]: e.target.value })}
                      className="flex-1 px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder={`Option ${opt}`}
                      required
                    />
                    {formData.questionType === "MCQ" ? (
                      <input
                        type="radio"
                        name="correctOption"
                        value={opt}
                        checked={formData.correctOption === opt}
                        onChange={(e) => setFormData({ ...formData, correctOption: e.target.value })}
                        className="w-5 h-5 text-primary focus:ring-primary border-border"
                        required
                      />
                    ) : (
                      <input
                        type="checkbox"
                        checked={formData.correctOptionsCsv.includes(opt)}
                        onChange={() => {
                          const current = formData.correctOptionsCsv.split(",").filter(x => x);
                          const newValue = current.includes(opt)
                            ? current.filter(x => x !== opt)
                            : [...current, opt];
                          setFormData({ ...formData, correctOptionsCsv: newValue.join(",") });
                        }}
                        className="w-5 h-5 text-primary focus:ring-primary border-border rounded"
                      />
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-sm text-text-secondary">
                {formData.questionType === "MCQ"
                  ? "Select the radio button for the correct answer"
                  : "Check all correct answers"}
              </p>
            </div>
          )}

          {formData.questionType === "FILL_BLANK" && (
            <div>
              <label className="block text-sm font-semibold text-text mb-2">
                Correct Answer <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                value={formData.correctAnswer}
                onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="Enter the correct answer"
                required
              />
            </div>
          )}
        </form>

        <div className="px-6 py-4 border-t border-border bg-surface flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 text-sm font-semibold text-text-secondary hover:text-text hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-3 text-sm font-semibold text-white bg-primary hover:bg-secondary rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{question ? 'Updating...' : 'Creating...'}</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{question ? 'Update Question' : 'Create Question'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestDetailPage;