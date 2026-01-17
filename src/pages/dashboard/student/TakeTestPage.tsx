import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { testApi } from "../../../services/testApi";
import type { Attempt, Question } from "../../../types";
import CameraPermissionModal from "../../../components/proctoring/CameraPermissionModal";
import ProctoringManager from "../../../components/proctoring/ProctoringManager";
import ConnectivityIndicator from "../../../components/common/ConnectivityIndicator";

const TakeTest: React.FC = () => {
  const { testId: testIdParam } = useParams<{ testId: string }>();
  const testId = Number(testIdParam);
  const navigate = useNavigate();
  const location = useLocation();

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notStarted, setNotStarted] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isMobilePaletteOpen, setIsMobilePaletteOpen] = useState(false);

  // Proctoring state
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [proctoringStream, setProctoringStream] = useState<MediaStream | null>(null);
  const [, setProctoringError] = useState<string | null>(null);
  const [showQuestionPaper, setShowQuestionPaper] = useState(false);

  const loadTest = async () => {
    try {
      setLoading(true);
      setError(null);
      setNotStarted(false);

      let currentAttempt: Attempt | null = null;
      let questionsList: Question[] = [];

      // 1. Check for attempt in location state (passed from instructions)
      if (location.state?.attempt) {
        currentAttempt = location.state.attempt as Attempt;
      }
      // 2. Check localStorage for active attempt
      else {
        const savedAttemptId = localStorage.getItem(`activeAttempt_${testId}`);
        if (savedAttemptId) {
          try {
            const res = await testApi.getAttempt(Number(savedAttemptId));
            if (res.success && res.data) {
              currentAttempt = res.data;
            }
          } catch (e) {
            console.error("Failed to load saved attempt", e);
            localStorage.removeItem(`activeAttempt_${testId}`);
          }
        }
      }

      if (!currentAttempt) {
        // No attempt found, redirect to instructions or show start screen
        setNotStarted(true);
        setLoading(false);
        return;
      }

      // 3. Load Questions
      try {
        const qRes = await testApi.getQuestions(testId);
        if (qRes.success && qRes.data) {
          questionsList = qRes.data;
        }
      } catch (qErr) {
        console.error("Failed to load questions", qErr);
        throw new Error("Failed to load test questions");
      }

      setAttempt(currentAttempt);
      setQuestions(questionsList);

      // 4. Restore answers if available (from attempt object)
      const existingAnswers: Record<number, string> = {};
      if (currentAttempt.answers) {
        currentAttempt.answers.forEach((ans: any) => {
          existingAnswers[ans.questionId] = ans.answerText || ans.selectedAnswer;
        });
      }
      setAnswers(existingAnswers);

      if (currentAttempt.completed) {
        // Attempt is done
        setError("This attempt is already completed.");
      }

    } catch (err: any) {
      console.error("Load test error:", err);
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

  // Force permissions check if resuming an active attempt without stream
  useEffect(() => {
    if (attempt && !attempt.completed && !proctoringStream && !loading) {
      setShowPermissionModal(true);
    }
  }, [attempt, proctoringStream, loading]);

  const handleStartTest = async () => {
    // Show permission modal first - don't start test until permissions granted
    setShowPermissionModal(true);
  };

  const handlePermissionGranted = async (stream: MediaStream) => {
    setProctoringStream(stream);
    setShowPermissionModal(false);

    // If we already have an active attempt (passed from instructions or restored), just proceed
    if (attempt) {
      return;
    }

    // Otherwise, start a new test attempt
    try {
      setLoading(true);
      const res = await testApi.startAttempt(testId);
      if (res.success && res.data) {
        localStorage.setItem(`activeAttempt_${testId}`, String(res.data.id));
        await loadTest();
      } else {
        throw new Error(res.message || "Failed to start attempt");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to start test");
      // Stop stream if test start fails
      stream.getTracks().forEach(track => track.stop());
      setProctoringStream(null);
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSaveAndNext = async (nextIndex: number) => {
    if (!attempt) return;

    // Save current question answer before moving
    const currentQ = questions[currentQuestionIndex];
    if (currentQ && answers[currentQ.id] && !attempt.completed) {
      try {
        await testApi.submitAnswer(attempt.id, {
          questionId: currentQ.id,
          answerText: answers[currentQ.id],
        });
      } catch (err) {
        console.error("Failed to save answer", err);
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
    // Cleanup proctoring stream
    if (proctoringStream) {
      proctoringStream.getTracks().forEach(track => track.stop());
      setProctoringStream(null);
    }
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

  // Safety check to satisfy TS
  if (!attempt) return null;

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Mobile Palette Overlay */}
      {isMobilePaletteOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobilePaletteOpen(false)}
        />
      )}

      {/* Header */}
      <header className="h-16 border-b flex items-center justify-between px-4 bg-white z-20 shrink-0">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMobilePaletteOpen(true)}
            className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-gray-800 leading-tight">Test Attempt #{attempt.attemptNumber}</h1>
            <div className="text-xs text-gray-500">ID: {attempt.testId}</div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowQuestionPaper(true)}
            className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center shadow-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            Question Paper
          </button>

          <button
            onClick={handleSubmitTest}
            className="hidden md:block px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded shadow-sm transition-colors"
          >
            Finish Section
          </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden relative">

        {/* Left Column: Question Palette (Fixed on mobile, col-span on proper screen) */}
        <div
          className={`
            fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-border transform transition-transform duration-200 ease-in-out md:static md:translate-x-0 md:col-span-3 lg:col-span-2 flex flex-col h-full mt-16 md:mt-0 shadow-lg md:shadow-none
            ${isMobilePaletteOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-gray-700">Palette</h2>
              <div className="text-xs text-gray-500 mt-0.5">
                Solved: <span className="text-green-600 font-bold">{Object.keys(answers).length}</span> / {questions.length}
              </div>
            </div>
            <button onClick={() => setIsMobilePaletteOpen(false)} className="md:hidden text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 bg-gray-50/50">
            <div className="grid grid-cols-5 gap-2">
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
                       aspect-square flex items-center justify-center rounded-md text-sm font-medium transition-all shadow-sm
                       ${isCurrent ? "ring-2 ring-primary ring-offset-1 border-primary z-10" : ""}
                       ${isAttempted
                        ? "bg-green-500 text-white border-green-600 hover:bg-green-600"
                        : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"}
                     `}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 border-t space-y-2 bg-white">
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-2">
              <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>Answered</div>
              <div className="flex items-center"><span className="w-2 h-2 rounded-full border border-gray-300 mr-2"></span>Pending</div>
              <div className="flex items-center"><span className="w-2 h-2 rounded-full ring-2 ring-primary mr-2"></span>Current</div>
            </div>
            <button
              onClick={handleSubmitTest}
              className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium shadow-sm"
            >
              Submit Test
            </button>
          </div>
        </div>

        {/* Middle Column: Question Area */}
        <div className="col-span-12 md:col-span-6 lg:col-span-7 flex flex-col h-full bg-gray-50 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-border min-h-full md:min-h-0 flex flex-col">
              {/* Question Header */}
              <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                <div>
                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded uppercase tracking-wider mb-2">
                    {currentQuestion.questionType.replace("_", " ")}
                  </span>
                  <h3 className="text-lg md:text-xl font-medium text-gray-800">
                    {currentQuestion.questionText}
                  </h3>
                </div>
                <div className="shrink-0 ml-4 text-right">
                  <div className="text-sm font-bold text-gray-700">Marks: {currentQuestion.marks}</div>
                  <div className="text-xs text-red-500">Neg: {currentQuestion.negativeMarks}</div>
                </div>
              </div>

              {/* Options Area */}
              <div className="p-6 space-y-4 flex-1">
                {currentQuestion.questionType === "MCQ" && (
                  <div className="space-y-3">
                    {["A", "B", "C", "D"].map((option) => {
                      const optionText = currentQuestion[`option${option}` as keyof Question] as string;
                      if (!optionText) return null;
                      const isSelected = answers[currentQuestion.id] === option;
                      return (
                        <label
                          key={option}
                          className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all group
                                  ${isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }
                                  ${attempt.completed ? "cursor-not-allowed opacity-75" : ""}
                                `}
                        >
                          <div className={`
                                    w-6 h-6 rounded-full border flex items-center justify-center mr-4 shrink-0 transition-colors
                                    ${isSelected ? "border-primary bg-primary text-white" : "border-gray-300 text-gray-500 group-hover:border-gray-400"}
                                `}>
                            {isSelected && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <input
                            type="radio"
                            name={`question-${currentQuestion.id}`}
                            disabled={attempt.completed}
                            value={option}
                            checked={isSelected}
                            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                            className="hidden"
                          />
                          <span className={`text-gray-700 ${isSelected ? "font-medium" : ""}`}>
                            {optionText}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* MAQ Logic */}
                {currentQuestion.questionType === "MAQ" && (
                  <div className="space-y-3">
                    {["A", "B", "C", "D"].map((option) => {
                      const optionText = currentQuestion[`option${option}` as keyof Question] as string;
                      if (!optionText) return null;
                      const isSelected = answers[currentQuestion.id]?.includes(option);
                      return (
                        <label key={option} className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all ${isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-gray-200 hover:bg-gray-50"}`}>
                          <input type="checkbox" className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary mr-3" checked={isSelected || false}
                            onChange={() => {
                              const current = answers[currentQuestion.id] || "";
                              const newAnswer = current.includes(option) ? current.replace(option, "").replace(/,,/g, ",").replace(/^,|,$/g, "") : current ? current + "," + option : option;
                              handleAnswerChange(currentQuestion.id, newAnswer);
                            }}
                            disabled={attempt.completed}
                          />
                          <span className="text-gray-700">{optionText}</span>
                        </label>
                      )
                    })}
                  </div>
                )}

                {/* Fill Blank Logic */}
                {currentQuestion.questionType === "FILL_BLANK" && (
                  <textarea
                    disabled={attempt.completed}
                    value={answers[currentQuestion.id] || ""}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent min-h-[120px]"
                    placeholder="Type your answer here..."
                  />
                )}
              </div>

              {/* Footer Nav */}
              <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-between items-center">
                <button
                  onClick={() => handleSaveAndNext(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0 || submitting}
                  className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium shadow-sm"
                >
                  Previous
                </button>

                {currentQuestionIndex < questions.length - 1 ? (
                  <button
                    onClick={() => handleSaveAndNext(currentQuestionIndex + 1)}
                    disabled={submitting}
                    className="px-6 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg shadow-sm transition-all flex items-center"
                  >
                    Save & Next
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                ) : (
                  <button
                    onClick={() => handleSaveAndNext(currentQuestionIndex)}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition-all"
                  >
                    Save
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Proctoring & System */}
        <div className="hidden md:flex md:col-span-3 lg:col-span-3 flex-col border-l border-border bg-gray-50 h-full overflow-y-auto">
          <div className="p-4 space-y-6">

            {/* 1. Camera View (Priority) */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-3 py-2 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Proctoring</h3>
                <span className="text-xs text-green-600 flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>Active</span>
              </div>
              <div className="p-2">
                {proctoringStream && attempt && !attempt.completed ? (
                  <ProctoringManager
                    stream={proctoringStream}
                    attemptId={attempt.id}
                    onError={(err) => setProctoringError(err)}
                    className="w-full"
                  />
                ) : (
                  <div className="aspect-video bg-gray-900 rounded flex flex-col items-center justify-center text-gray-400">
                    <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    <span className="text-xs">Camera Feed Inactive</span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. System Connectivity */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-3 py-2 border-b bg-gray-50">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Network Status</h3>
              </div>
              <div className="p-3">
                <ConnectivityIndicator className="w-full" />
              </div>
            </div>

            {/* 3. Session Info */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-sm space-y-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Session Info</h3>
              <div className="flex justify-between">
                <span className="text-gray-500">Student:</span>
                <span className="font-medium text-gray-800">You</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Test ID:</span>
                <span className="font-mono text-gray-800">{attempt.testId}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="text-xs text-gray-400">
                  Proctoring AI is monitoring for:
                  <ul className="list-disc pl-4 mt-1 space-y-0.5">
                    <li>Multiple faces</li>
                    <li>Mobile usage</li>
                    <li>Head movement</li>
                    <li>Background audio</li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Modals */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Submit Test?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to finish the test? You cannot undo this action.
              <br />
              <span className="text-sm mt-2 block font-medium">
                Answered: {Object.keys(answers).length} / {questions.length}
              </span>
            </p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowSubmitModal(false)} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleConfirmSubmit} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold shadow-sm">Submit Now</button>
            </div>
          </div>
        </div>
      )}

      {showPermissionModal && (
        <CameraPermissionModal
          onPermissionGranted={handlePermissionGranted}
          onPermissionDenied={() => {
            setShowPermissionModal(false);
            setError("Camera and microphone access is required for this proctored test.");
          }}
          onCancel={() => {
            setShowPermissionModal(false);
            navigate("/dashboard");
          }}
        />
      )}

      {showQuestionPaper && (
        <QuestionPaperModal questions={questions} onClose={() => setShowQuestionPaper(false)} />
      )}
    </div>
  );
};

export default TakeTest;

interface QuestionPaperModalProps {
  questions: Question[];
  onClose: () => void;
}

const QuestionPaperModal: React.FC<QuestionPaperModalProps> = ({ questions, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-800">Question Paper</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-8">
          {questions.map((q, idx) => (
            <div key={q.id} className="border-b last:border-0 pb-6 last:pb-0">
              <div className="flex space-x-3">
                <span className="font-bold text-gray-500">Q.{idx + 1}</span>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium whitespace-pre-wrap">{q.questionText}</p>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {q.questionType === "MCQ" || q.questionType === "MAQ" ? (
                      ["A", "B", "C", "D"].map(opt => {
                        const txt = q[`option${opt}` as keyof Question];
                        if (!txt) return null;
                        return (
                          <div key={opt} className="text-sm text-gray-600 bg-gray-50 p-2 rounded border">
                            <span className="font-bold mr-1">{opt}.</span> {txt}
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-sm text-gray-500 italic">Fill in the blank question</div>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    Marks: {q.marks} | Negative: {q.negativeMarks}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
