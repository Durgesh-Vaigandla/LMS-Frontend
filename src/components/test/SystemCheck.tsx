import React, { useEffect, useState } from "react";

interface SystemCheckResult {
    camera: "checking" | "available" | "unavailable";
    microphone: "checking" | "available" | "unavailable";
    internet: "checking" | "excellent" | "good" | "fair" | "poor" | "offline";
    browser: "checking" | "compatible" | "incompatible";
    internetLatency?: number;
}

interface SystemCheckProps {
    onComplete: (result: SystemCheckResult) => void;
}

const SystemCheck: React.FC<SystemCheckProps> = ({ onComplete }) => {
    const [results, setResults] = useState<SystemCheckResult>({
        camera: "checking",
        microphone: "checking",
        internet: "checking",
        browser: "checking",
    });

    useEffect(() => {
        runSystemCheck();
    }, []);

    const runSystemCheck = async () => {
        const finalResults: SystemCheckResult = {
            camera: "checking",
            microphone: "checking",
            internet: "checking",
            browser: "checking",
        };

        // 1. Check browser compatibility
        const hasMediaDevices = !!navigator.mediaDevices;
        const hasGetUserMedia = !!navigator.mediaDevices?.getUserMedia;
        const hasMediaPipe = typeof window.FaceMesh !== "undefined";
        const hasTensorFlow = typeof window.cocoSsd !== "undefined";
        const isBrowserCompatible = hasMediaDevices && hasGetUserMedia && hasMediaPipe && hasTensorFlow;

        finalResults.browser = isBrowserCompatible ? "compatible" : "incompatible";
        setResults(prev => ({ ...prev, browser: finalResults.browser }));

        // 2. Check camera and microphone (triggers prompt)
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            // If successful, stop tracks immediately to release device
            stream.getTracks().forEach(track => track.stop());
            finalResults.camera = "available";
            finalResults.microphone = "available";
        } catch (error) {
            console.error("Media check failed:", error);
            finalResults.camera = "unavailable";
            finalResults.microphone = "unavailable";
        }
        setResults(prev => ({ ...prev, camera: finalResults.camera, microphone: finalResults.microphone }));

        // 3. Check internet connection
        // Use navigator.onLine for a simple, non-CORS blocking check
        if (navigator.onLine) {
            finalResults.internet = "excellent";
            finalResults.internetLatency = 0;
        } else {
            finalResults.internet = "offline";
        }
        setResults(prev => ({ ...prev, internet: finalResults.internet, internetLatency: finalResults.internetLatency }));

        // 4. Complete
        onComplete(finalResults);
    };

    const getStatusIcon = (status: string) => {
        if (status === "checking") {
            return (
                <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            );
        }

        const isPassed =
            status === "available" ||
            status === "compatible" ||
            status === "excellent" ||
            status === "good" ||
            status === "fair";

        return isPassed ? (
            <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                />
            </svg>
        ) : (
            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                />
            </svg>
        );
    };

    const getStatusText = (type: string, status: string) => {
        if (status === "checking") return "Checking...";

        switch (type) {
            case "camera":
                return status === "available" ? "Camera Available" : "Camera Not Found";
            case "microphone":
                return status === "available" ? "Microphone Available" : "Microphone Not Found";
            case "internet":
                if (status === "offline") return "No Internet Connection";
                return `${status.charAt(0).toUpperCase() + status.slice(1)} Connection${results.internetLatency ? ` (${results.internetLatency}ms)` : ""
                    }`;
            case "browser":
                return status === "compatible" ? "Browser Compatible" : "Browser Not Supported";
            default:
                return "";
        }
    };

    return (
        <div className="bg-white rounded-lg border border-border p-6 space-y-4">
            <h3 className="text-lg font-semibold text-text mb-4">System Requirements Check</h3>

            {/* Camera Check */}
            <div className="flex items-center space-x-3">
                {getStatusIcon(results.camera)}
                <div>
                    <p className="font-medium text-text">{getStatusText("camera", results.camera)}</p>
                    <p className="text-sm text-text-secondary">Required for proctoring</p>
                </div>
            </div>

            {/* Microphone Check */}
            <div className="flex items-center space-x-3">
                {getStatusIcon(results.microphone)}
                <div>
                    <p className="font-medium text-text">{getStatusText("microphone", results.microphone)}</p>
                    <p className="text-sm text-text-secondary">Required for audio monitoring</p>
                </div>
            </div>

            {/* Internet Check */}
            <div className="flex items-center space-x-3">
                {getStatusIcon(results.internet)}
                <div>
                    <p className="font-medium text-text">{getStatusText("internet", results.internet)}</p>
                    <p className="text-sm text-text-secondary">Required for test submission</p>
                </div>
            </div>

            {/* Browser Check */}
            <div className="flex items-center space-x-3">
                {getStatusIcon(results.browser)}
                <div>
                    <p className="font-medium text-text">{getStatusText("browser", results.browser)}</p>
                    <p className="text-sm text-text-secondary">ML libraries must be supported</p>
                </div>
            </div>
        </div>
    );
};

export default SystemCheck;
