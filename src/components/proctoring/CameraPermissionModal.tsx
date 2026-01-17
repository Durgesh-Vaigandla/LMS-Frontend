import React, { useState, useEffect, useRef } from "react";

interface CameraPermissionModalProps {
    onPermissionGranted: (stream: MediaStream) => void;
    onPermissionDenied: () => void;
    onCancel: () => void;
}

const CameraPermissionModal: React.FC<CameraPermissionModalProps> = ({
    onPermissionGranted,
    onPermissionDenied,
    onCancel,
}) => {
    const [isRequesting, setIsRequesting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const requestPermissions = async () => {
        setIsRequesting(true);
        setError(null);

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: "user" },
                audio: true,
            });

            setStream(mediaStream);

            // Show preview
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err: any) {
            console.error("Permission error:", err);

            let errorMessage = "Failed to access camera and microphone.";

            if (err.name === "NotAllowedError") {
                errorMessage = "Camera/microphone access denied. Please allow access to continue.";
            } else if (err.name === "NotFoundError") {
                errorMessage = "No camera or microphone found. Please connect a camera.";
            } else if (err.name === "NotReadableError") {
                errorMessage = "Camera is already in use by another application.";
            }

            setError(errorMessage);
            onPermissionDenied();
        } finally {
            setIsRequesting(false);
        }
    };

    const handleContinue = () => {
        if (stream) {
            onPermissionGranted(stream);
        }
    };

    const handleCancel = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        onCancel();
    };

    useEffect(() => {
        return () => {
            // Cleanup: stop all tracks when component unmounts
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-secondary p-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                            <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Proctoring Required</h2>
                            <p className="text-red-100 text-sm">Camera & Microphone Access Needed</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {!stream && !error && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="font-semibold text-blue-900 mb-2">Why do we need this?</h3>
                                <p className="text-sm text-blue-800">
                                    This test requires proctoring to ensure academic integrity. We need access to:
                                </p>
                                <ul className="mt-2 space-y-1 text-sm text-blue-800">
                                    <li className="flex items-start">
                                        <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span><strong>Camera</strong> - to verify your identity and monitor your test environment</span>
                                    </li>
                                    <li className="flex items-start">
                                        <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span><strong>Microphone</strong> - to detect suspicious audio activity</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <h3 className="font-semibold text-green-900 mb-2 flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Your Privacy is Protected
                                </h3>
                                <p className="text-sm text-green-800">
                                    • No video recording - only monitoring data is stored<br />
                                    • All processing happens locally in your browser<br />
                                    • Data is encrypted and visible only to authorized personnel
                                </p>
                            </div>
                        </div>
                    )}

                    {stream && videoRef.current && (
                        <div className="space-y-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center">
                                <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm font-medium text-green-800">Camera and microphone access granted!</span>
                            </div>

                            <div className="relative rounded-lg overflow-hidden bg-black">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-64 object-cover transform scale-x-[-1]"
                                />
                                <div className="absolute bottom-3 left-3 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium">
                                    Camera Preview
                                </div>
                            </div>

                            <p className="text-sm text-center text-text-secondary">
                                You can see your camera preview above. Click "Continue to Test" to proceed.
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-start">
                                <svg className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-primary">Permission Error</h3>
                                    <p className="mt-1 text-sm text-red-700">{error}</p>
                                    <button
                                        onClick={requestPermissions}
                                        className="mt-3 text-sm font-medium text-primary hover:text-red-800 underline"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                    <button
                        onClick={handleCancel}
                        className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
                    >
                        Cancel
                    </button>

                    {!stream && !error && (
                        <button
                            onClick={requestPermissions}
                            disabled={isRequesting}
                            className="px-6 py-2.5 bg-primary hover:bg-secondary text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                            {isRequesting ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>Requesting Access...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    <span>Grant Access</span>
                                </>
                            )}
                        </button>
                    )}

                    {stream && (
                        <button
                            onClick={handleContinue}
                            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center space-x-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            <span>Continue to Test</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CameraPermissionModal;
