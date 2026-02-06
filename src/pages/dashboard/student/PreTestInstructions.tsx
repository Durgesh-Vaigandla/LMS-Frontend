import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import SystemCheck from "../../../components/test/SystemCheck";
import { testApi } from "../../../services/testApi";
import type { Test } from "../../../types";
import { proctoringModelLoader } from "../../../utils/ProctoringModelLoader";

interface SystemCheckResult {
    camera: "checking" | "available" | "unavailable";
    microphone: "checking" | "available" | "unavailable";
    internet: "checking" | "excellent" | "good" | "fair" | "poor" | "offline";
    browser: "checking" | "compatible" | "incompatible";
    faceCheck: "checking" | "success" | "failed";
    internetLatency?: number;
}

const PreTestInstructions: React.FC = () => {
    const { testId } = useParams<{ testId: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const [test, setTest] = useState<Test | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [agreed, setAgreed] = useState(false);
    const [systemCheckComplete, setSystemCheckComplete] = useState(false);
    const [systemResults, setSystemResults] = useState<SystemCheckResult | null>(null);
    const [modelStatus, setModelStatus] = useState<"loading" | "ready" | "error">("loading");

    useEffect(() => {
        const fetchTestDetails = async () => {
            if (!testId) return;
            try {
                setLoading(true);
                // Since we don't have a direct public getTestById, we fetch available tests and find it.
                // Ideally backend should provide a specific endpoint for test details (instructions view).
                const response = await testApi.getAvailableTests();
                if (response.success && response.data) {
                    const foundTest = response.data.find(t => t.id === Number(testId));
                    if (foundTest) {
                        setTest(foundTest);
                    } else {
                        // Fallback: If not in available (maybe already attempted?), try to get from admin API if role allows? 
                        // Or just assume it exists if we are here?
                        // For student, we only see available tests. 
                        setError("Test not found or access denied.");
                    }
                } else {
                    setError("Failed to load test details.");
                }
            } catch (err) {
                const status = (err as { response?: { status?: number } })?.response?.status;
                if (status === 401 || status === 403) {
                    localStorage.removeItem("token");
                    navigate("/login", { replace: true });
                    return;
                }
                console.error("Failed to fetch test details:", err);
                setError("Failed to load test details.");
            } finally {
                setLoading(false);
            }
        };

        fetchTestDetails();
    }, [testId]);

    useEffect(() => {
        // Only load model if test requires proctoring
        if (!test || !test.proctored) {
            setModelStatus("ready"); // Not needed, so mark as ready
            return;
        }

        let isMounted = true;
        if (proctoringModelLoader.getModel()) {
            setModelStatus("ready");
        } else {
            setModelStatus("loading");
            proctoringModelLoader
                .loadModel()
                .then(() => {
                    if (isMounted) setModelStatus("ready");
                })
                .catch(() => {
                    if (isMounted) setModelStatus("error");
                });
        }

        return () => {
            isMounted = false;
        };
    }, [test]);

    const handleSystemCheckComplete = (results: SystemCheckResult) => {
        setSystemCheckComplete(true);
        setSystemResults(results);
    };

    const canStartTest = () => {
        if (!agreed) return false;

        // For non-proctored tests, only agreement is required
        if (!test?.proctored) {
            return true;
        }

        // For proctored tests, must complete system check
        if (!systemCheckComplete || !systemResults) return false;

        // Must have camera, microphone, and be online
        const criticalChecksPassed =
            systemResults.camera === "available" &&
            systemResults.microphone === "available" &&
            systemResults.internet !== "offline" &&
            systemResults.browser === "compatible" &&
            systemResults.faceCheck === "success" &&
            modelStatus === "ready";

        return criticalChecksPassed;
    };

    const handleStartTest = async () => {
        try {
            if (!testId) return;

            const isResume = Boolean((location.state as { resume?: boolean } | null)?.resume);

            if (isResume) {
                const latestRes = await testApi.getLatestAttempt(Number(testId), true);
                if (latestRes.success && latestRes.data?.id) {
                    const attemptRes = await testApi.getAttempt(latestRes.data.id);
                    if (attemptRes.success && attemptRes.data) {
                        localStorage.setItem(`activeAttempt_${testId}`, JSON.stringify(attemptRes.data.id));
                        navigate(`/dashboard/test/take/${testId}`, {
                            state: { attemptId: attemptRes.data.id, attempt: attemptRes.data }
                        });
                        return;
                    }
                }
                // Fallback to start new attempt if resume not found
            }

            // Start the test attempt
            const response = await testApi.startAttempt(Number(testId));

            if (response.success && response.data) {
                const attempt = response.data;

                // Save to localStorage for recovery
                localStorage.setItem(`activeAttempt_${testId}`, JSON.stringify(attempt.id));

                // Navigate to test page with attempt data
                navigate(`/dashboard/test/take/${testId}`, {
                    state: { attemptId: attempt.id, attempt: attempt }
                });
            } else {
                alert("Failed to start test. Please try again.");
            }
        } catch (error) {
            const status = (error as { response?: { status?: number } })?.response?.status;
            if (status === 401 || status === 403) {
                localStorage.removeItem("token");
                navigate("/login", { replace: true });
                return;
            }
            console.error("Failed to start test:", error);
            const errorMessage =
                (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                "Error starting test. Please check your connection and try again.";
            alert(`Failed to start test: ${errorMessage}`);
        }
    };

    const handleCancel = () => {
        navigate("/dashboard");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-text font-medium">Loading instructions...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg max-w-md text-center">
                    <p>{error}</p>
                    <button onClick={() => navigate("/dashboard")} className="mt-4 text-sm font-bold hover:underline">
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Default values if test not found but we want to show something (or rely on Test object if strict)
    // We'll rely on `test` object. If null, we showed error above.
    if (!test) return null;

    return (
        <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl sm:text-4xl font-bold text-text">
                        📝 {test.title}
                    </h1>
                    <p className="text-text-secondary">
                        Please review the following information before starting your test
                    </p>
                </div>

                {/* Test Info Card */}
                <div className="bg-white rounded-xl shadow-sm border border-border p-6">
                    <h2 className="text-xl font-semibold text-text mb-4">Test Information</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-text">Duration</p>
                                <p className="text-sm text-text-secondary">
                                    {test.endTime && test.startTime
                                        ? `${Math.abs(new Date(test.endTime).getTime() - new Date(test.startTime).getTime()) / 60000} mins`
                                        : "Active until end time"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-text">Total Marks</p>
                                <p className="text-sm text-text-secondary">{test.totalMarks} points</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-text">Attempts Allowed</p>
                                <p className="text-sm text-text-secondary">{test.maxAttempts} attempts</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-text">Proctoring</p>
                                <p className="text-sm text-text-secondary">
                                    {test.proctored ? (
                                        <span className="text-red-600 font-semibold">✓ Enabled (AI Monitoring)</span>
                                    ) : (
                                        <span className="text-green-600 font-semibold">✗ Not Required</span>
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-text">Description</p>
                                <p className="text-sm text-text-secondary line-clamp-2">{test.description}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Check - Only for proctored tests */}
                {test.proctored && <SystemCheck onComplete={handleSystemCheckComplete} />}

                {/* Model Status - Only for proctored tests */}
                {test.proctored && (
                    <div className="bg-white rounded-xl shadow-sm border border-border p-6">
                        <h3 className="text-lg font-semibold text-text mb-2">Proctoring Model</h3>
                        {modelStatus === "loading" && (
                            <p className="text-sm text-text-secondary">
                                Loading FaceLandmarks Detection Model...
                            </p>
                        )}
                        {modelStatus === "ready" && (
                            <p className="text-sm text-green-600 font-medium">
                                Model loaded and ready.
                            </p>
                        )}
                        {modelStatus === "error" && (
                            <p className="text-sm text-red-600">
                                Failed to load the proctoring model. Please refresh and try again.
                            </p>
                        )}
                    </div>
                )}

                {/* Proctoring Information - Only for proctored tests */}
                {test.proctored && (
                    <div className="bg-red-50 rounded-xl border border-red-200 p-6">
                    <div className="flex items-start space-x-3 mb-4">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-primary mb-2">
                                🎥 Proctoring Information
                            </h3>
                            <p className="text-sm text-text-secondary mb-3">
                                This test uses ML-based proctoring to ensure academic integrity. The following will be monitored:
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            { icon: "👤", text: "Face position & orientation" },
                            { icon: "👥", text: "Multiple people detection" },
                            { icon: "📱", text: "Mobile phone detection" },
                            { icon: "🔊", text: "Audio activity" },
                            { icon: "👁️", text: "Gaze direction" },
                            { icon: "📹", text: "Camera visibility" },
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center space-x-2 text-sm text-text-secondary">
                                <span className="text-lg">{item.icon}</span>
                                <span>{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
                )}

                {/* Privacy & Rules - Only for proctored tests */}
                {test.proctored && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Privacy */}
                    <div className="bg-green-50 rounded-xl border border-green-200 p-6">
                        <div className="flex items-center space-x-2 mb-3">
                            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <h3 className="font-semibold text-green-900">Your Privacy</h3>
                        </div>
                        <ul className="space-y-2 text-sm text-green-800">
                            <li className="flex items-start">
                                <span className="mr-2">✓</span>
                                <span>No video recording - only violation counts stored</span>
                            </li>
                            <li className="flex items-start">
                                <span className="mr-2">✓</span>
                                <span>All processing happens locally in your browser</span>
                            </li>
                            <li className="flex items-start">
                                <span className="mr-2">✓</span>
                                <span>Data encrypted and visible only to authorized staff</span>
                            </li>
                        </ul>
                    </div>

                    {/* Test Rules */}
                    <div className="bg-secondary/10 rounded-xl border border-secondary/20 p-6">
                        <div className="flex items-center space-x-2 mb-3">
                            <svg className="w-6 h-6 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <h3 className="font-semibold text-secondary">Test Rules</h3>
                        </div>
                        <ul className="space-y-2 text-sm text-stone-700">
                            <li className="flex items-start">
                                <span className="mr-2 text-secondary">•</span>
                                <span>Stay in camera frame at all times</span>
                            </li>
                            <li className="flex items-start">
                                <span className="mr-2 text-secondary">•</span>
                                <span>No talking or making sounds during test</span>
                            </li>
                            <li className="flex items-start">
                                <span className="mr-2 text-secondary">•</span>
                                <span>No mobile devices visible</span>
                            </li>
                            <li className="flex items-start">
                                <span className="mr-2 text-secondary">•</span>
                                <span>Do not leave or switch tabs during test</span>
                            </li>
                        </ul>
                    </div>
                </div>
                )}

                {/* Agreement */}
                <div className="bg-white rounded-xl shadow-sm border border-border p-6">
                    <label className="flex items-start cursor-pointer">
                        <input
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            className="w-5 h-5 mt-0.5 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
                        />
                        <span className="ml-3 text-text">
                            I have read and understood the test instructions{test.proctored ? ', proctoring requirements,' : ''} and test rules. I agree to follow
                            all guidelines and understand that violations may result in test invalidation.
                        </span>
                    </label>
                </div>

                {/* Warnings if system check failed - Only for proctored tests */}
                {test.proctored && systemCheckComplete && !canStartTest() && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-start space-x-3">
                            <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <h4 className="font-semibold text-red-900 mb-1">System Requirements Not Met</h4>
                                <p className="text-sm text-red-800">
                                    Please resolve the system check failures before starting the test. Camera, microphone, internet connection,
                                    and compatible browser are required.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                    <button
                        onClick={handleCancel}
                        className="px-6 py-3 border-2 border-border text-text-secondary rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleStartTest}
                        disabled={!canStartTest()}
                        className="px-8 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 flex items-center justify-center space-x-2"
                    >
                        {!agreed ? (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span>Please Agree to Continue</span>
                            </>
                        ) : !systemCheckComplete ? (
                            <>
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>System Check in Progress...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                                <span>Start Test</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PreTestInstructions;
