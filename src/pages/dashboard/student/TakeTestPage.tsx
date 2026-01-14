import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { testApi } from "../../../services/testApi";
import type { AttemptInfo, Question } from "../../../types";

const TakeTest: React.FC = () => {
  const { testId: testIdParam } = useParams<{ testId: string }>();
  const testId = Number(testIdParam);
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState<AttemptInfo | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notStarted, setNotStarted] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isMobilePaletteOpen, setIsMobilePaletteOpen] = useState(false);

  const loadTest = async () => {
    try {
      setLoading(true);
      setError(null);
      setNotStarted(false);

      // Fetch the latest state directly from the backend
      try {
        const stateRes = await testApi.getTestAttemptState(testId);

        if (stateRes.success && stateRes.data) {
          const { attempt, questions, answers } = stateRes.data;

          setAttempt(attempt);
          setQuestions(questions);

          // Deserialize answers: API returns Record<string, string>, state needs Record<number, string>
          const loadedAnswers: Record<number, string> = {};
          if (answers) {
            Object.entries(answers).forEach(([qId, ans]) => {
              loadedAnswers[Number(qId)] = ans;
            });
          }
          setAnswers(loadedAnswers);

          if (attempt.completed) {
            // Handle completed attempt if necessary
          }
        } else {
          throw new Error(stateRes.message || "Failed to load attempt state");
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          // 404 means no attempt exists -> Show Start Screen
          setNotStarted(true);
        } else {
          throw err;
        }
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Failed to load test"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (testId) {
      loadTest();
    }
  }, [testId]);

  const handleStartTest = async () => {
    try {
      setLoading(true);
      // Explicitly start a new attempt
      await testApi.startAttempt(testId);
      // Reload state to get questions and new attempt ID
      await loadTest();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to start test");
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSaveAndNext = async (nextIndex: number) => {
    if (!attempt) return;

    // Save current question answer before moving
    // If user is just viewing previously completed answer or viewing without answering, we might skip
    // But requirement says "when user clicks next u can fetch once and when user clicks next quesion only send that quesion response"
    const currentQ = questions[currentQuestionIndex];
    if (currentQ && answers[currentQ.id] && !attempt.completed) {
      try {
        await testApi.submitAnswer(attempt.id, {
          questionId: currentQ.id,
          answerText: answers[currentQ.id],
        });
      } catch (err) {
        console.error("Failed to save answer", err);
        // We could block navigation or just show a warning, but let's proceed for smooth UX
        // Or store error state locally?
      }
    }

    setCurrentQuestionIndex(nextIndex);
  };

  const handleQuestionPaletteClick = async (index: number) => {
    if (index === currentQuestionIndex) return;
    await handleSaveAndNext(index);
  };

  const handleSubmitTest = async () => {
    setShowSubmitModal(true);
  };

  const handleConfirmSubmit = async () => {
    if (!attempt) return;
    setShowSubmitModal(false);

    // Save current answer before submitting
    const currentQ = questions[currentQuestionIndex];
    if (currentQ && answers[currentQ.id] && !attempt.completed) {
      try {
        await testApi.submitAnswer(attempt.id, {
          questionId: currentQ.id,
          answerText: answers[currentQ.id],
        });
      } catch (err) {
        console.error("Failed to save last answer", err);
      }
    }

    setSubmitting(true);
    try {
      await testApi.submitAttempt(attempt.id);
      navigate("/dashboard"); // Redirect to dashboard after submit
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit test");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExit = () => {
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8">
          <div className="text-text">Loading test...</div>
        </div>
      </div>
    );
  }

  if (notStarted) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 max-w-md shadow-lg text-center">
          <h2 className="text-xl font-bold text-text mb-4">Start Test</h2>
          <p className="text-text-secondary mb-6">
            You are about to start a new attempt for this test. Once started,
            the timer will begin.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleExit}
              className="px-4 py-2 border border-border text-text-secondary rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleStartTest}
              className="px-6 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded"
            >
              Start Attempt
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error || !attempt || questions.length === 0) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 max-w-md shadow-lg">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              {error || "Failed to load test"}
            </div>
            <button
              onClick={handleExit}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row h-screen overflow-hidden">
      {/* Mobile Palette Overlay */}
      {isMobilePaletteOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobilePaletteOpen(false)}
        />
      )}

      {/* Sidebar - Question Palette */}
      <div
        className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-border transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:w-1/4 lg:w-1/5 flex flex-col h-full
        ${isMobilePaletteOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="p-4 border-b border-border flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-text">Questions</h2>
            <div className="text-sm text-text-secondary mt-1">
              Attempted: {}
              <span className="text-green-600 font-semibold">
                {Object.keys(answers).length}
              </span>{" "}
              / {questions.length}
            </div>
          </div>
          <button
            onClick={() => setIsMobilePaletteOpen(false)}
            className="md:hidden text-gray-500 hover:text-gray-700"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const isAttempted = !!answers[q.id];
              const isCurrent = currentQuestionIndex === idx;

              return (
                <button
                  key={q.id}
                  onClick={() => {
                    handleQuestionPaletteClick(idx);
                    setIsMobilePaletteOpen(false);
                  }}
                  className={`
                                aspect-square flex items-center justify-center rounded-md text-sm font-medium transition-colors
                                ${
                                  isCurrent
                                    ? "ring-2 ring-primary ring-offset-1"
                                    : ""
                                }
                                ${
                                  isAttempted
                                    ? "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200"
                                    : "bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200"
                                }
                            `}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex items-center text-xs text-text-secondary">
              <div className="w-4 h-4 bg-green-100 border border-green-200 rounded mr-2"></div>
              <span>Attempted ({Object.keys(answers).length})</span>
            </div>
            <div className="flex items-center text-xs text-text-secondary">
              <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded mr-2"></div>
              <span>
                Not Attempted ({questions.length - Object.keys(answers).length})
              </span>
            </div>
            <div className="flex items-center text-xs text-text-secondary">
              <div className="w-4 h-4 border-2 border-primary rounded mr-2"></div>
              <span>Current</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border space-y-3">
          <button
            onClick={handleSubmitTest}
            disabled={submitting || attempt?.completed}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded shadow-sm hover:shadow transition-all disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Test"}
          </button>

          <button
            onClick={handleExit}
            className="w-full px-4 py-2 border border-red-200 text-red-600 rounded hover:bg-red-50 transition-colors"
            disabled={submitting}
          >
            Exit Test
          </button>
        </div>
      </div>

      {/* Main Content - Question */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
        <div className="bg-white border-b border-border px-4 md:px-6 py-4 flex justify-between items-center shadow-sm z-10">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMobilePaletteOpen(true)}
              className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h1 className="text-lg md:text-xl font-bold text-text truncate max-w-[150px] md:max-w-none">
              Attempt #{attempt.attemptNumber}
            </h1>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            <button
              onClick={handleSubmitTest}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded shadow-sm"
            >
              Submit
            </button>
            <div className="text-sm font-mono bg-gray-100 px-3 py-1.5 rounded whitespace-nowrap">
              Q. {currentQuestionIndex + 1} / {questions.length}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-border p-6 md:p-8">
            <div className="mb-6">
              <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold mb-3">
                {currentQuestion.questionType.replace("_", " ")}
              </span>
              <h3 className="text-xl md:text-2xl font-medium text-text mb-4 leading-relaxed">
                {currentQuestion.questionText}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-text-secondary border-t border-dashed border-gray-200 pt-4">
                <span className="flex items-center">
                  <span className="font-semibold text-text mr-1">Marks:</span>{" "}
                  {currentQuestion.marks}
                </span>
                <span className="flex items-center">
                  <span className="font-semibold text-text mr-1">
                    Negative:
                  </span>{" "}
                  {currentQuestion.negativeMarks}
                </span>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {currentQuestion.questionType === "MCQ" && (
                <div className="space-y-3">
                  {["A", "B", "C", "D"].map((option) => {
                    const optionText = currentQuestion[
                      `option${option}` as keyof Question
                    ] as string;
                    if (!optionText) return null;
                    return (
                      <label
                        key={option}
                        className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all
                                    ${
                                      answers[currentQuestion.id] === option
                                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                                        : "border-border hover:bg-gray-50"
                                    }
                                    ${
                                      attempt.completed
                                        ? "cursor-not-allowed opacity-75"
                                        : ""
                                    }
                                `}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          disabled={attempt?.completed}
                          value={option}
                          checked={answers[currentQuestion.id] === option}
                          onChange={(e) =>
                            handleAnswerChange(
                              currentQuestion.id,
                              e.target.value
                            )
                          }
                          className="w-4 h-4 text-primary border-gray-300 focus:ring-primary mr-3"
                        />
                        <span className="text-text flex-1">
                          <span className="font-bold mr-2">{option}.</span>{" "}
                          {optionText}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {currentQuestion.questionType === "MAQ" && (
                <div className="space-y-3">
                  {["A", "B", "C", "D"].map((option) => {
                    const optionText = currentQuestion[
                      `option${option}` as keyof Question
                    ] as string;
                    if (!optionText) return null;
                    const isSelected =
                      answers[currentQuestion.id]?.includes(option);
                    return (
                      <label
                        key={option}
                        className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all
                                    ${
                                      isSelected
                                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                                        : "border-border hover:bg-gray-50"
                                    }
                                     ${
                                       attempt.completed
                                         ? "cursor-not-allowed opacity-75"
                                         : ""
                                     }
                                `}
                      >
                        <input
                          type="checkbox"
                          disabled={attempt?.completed}
                          value={option}
                          checked={isSelected || false}
                          onChange={() => {
                            const current = answers[currentQuestion.id] || "";
                            const newAnswer = current.includes(option)
                              ? current
                                  .replace(option, "")
                                  .replace(/,,/g, ",")
                                  .replace(/^,|,$/g, "")
                              : current
                              ? current + "," + option
                              : option;
                            handleAnswerChange(currentQuestion.id, newAnswer);
                          }}
                          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary mr-3"
                        />
                        <span className="text-text flex-1">
                          <span className="font-bold mr-2">{option}.</span>{" "}
                          {optionText}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {currentQuestion.questionType === "FILL_BLANK" && (
                <div className="mt-2">
                  <textarea
                    disabled={attempt?.completed}
                    value={answers[currentQuestion.id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(currentQuestion.id, e.target.value)
                    }
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px]"
                    placeholder="Type your answer here..."
                  />
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-border">
              <button
                onClick={() =>
                  handleSaveAndNext(Math.max(0, currentQuestionIndex - 1))
                }
                disabled={currentQuestionIndex === 0 || submitting}
                className="px-6 py-2 border border-border text-text rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {currentQuestionIndex < questions.length - 1 ? (
                <button
                  onClick={() => handleSaveAndNext(currentQuestionIndex + 1)}
                  disabled={submitting}
                  className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50"
                >
                  Save & Next
                </button>
              ) : (
                <button
                  onClick={() => handleSaveAndNext(currentQuestionIndex)}
                  // disabled={submitting || attempt?.completed}
                  className="px-8 py-2.5 bg-primary hover:bg-primary text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                >
                  Save
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Submit Confirmation Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all scale-100">
              <h3 className="text-lg font-bold text-text mb-2">Submit Test?</h3>
              <p className="text-text-secondary mb-6">
                Are you sure you want to submit? You won't be able to change
                your answers after submitting.
                <br />
                <span className="text-sm mt-2 block">
                  attempted: {Object.keys(answers).length} / {questions.length}
                </span>
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 border border-border text-text rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSubmit}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded shadow-sm hover:shadow transition-all"
                >
                  Yes, Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TakeTest;
