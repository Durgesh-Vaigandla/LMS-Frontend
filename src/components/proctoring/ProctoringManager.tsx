import React, { useEffect, useRef, useState } from "react";
import { testApi } from "../../services/testApi";
import type { ViolationCounts, SessionReportUpdate } from "../../types/proctoring.d";

interface ProctoringManagerProps {
    stream: MediaStream;
    attemptId: number;
    onError?: (error: string) => void;
    className?: string;
}

const ProctoringManager: React.FC<ProctoringManagerProps> = ({
    stream,
    attemptId,
    onError,
    className = "",
}) => {
    // ... (refs and state remain same)
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [faceMesh, setFaceMesh] = useState<any>(null);
    const [objectDetector, setObjectDetector] = useState<any>(null);
    const [camera, setCamera] = useState<any>(null);
    const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

    const [violationCounts, setViolationCounts] = useState<ViolationCounts>({
        HEAD_TURNED: 0,
        HEAD_TILT: 0,
        GAZE_AWAY: 0,
        MULTIPLE_PEOPLE: 0,
        FACE_VISIBILITY: 0,
        MOBILE_DETECTED: 0,
        AUDIO_DETECTED: 0,
    });

    const [, setViolationState] = useState<Record<keyof ViolationCounts, { active: boolean }>>({
        HEAD_TURNED: { active: false },
        HEAD_TILT: { active: false },
        GAZE_AWAY: { active: false },
        MULTIPLE_PEOPLE: { active: false },
        FACE_VISIBILITY: { active: false },
        MOBILE_DETECTED: { active: false },
        AUDIO_DETECTED: { active: false },
    });
    // Kept commented out for reference or if needed later, but removing declaration to silence TS error.
    // Actually, looking at updateViolationStats (lines 287+), it USES setViolationState.
    // So `violationState` IS used? No, the error says 'violationState' is declared but never read.
    // Ah, `setViolationState` is used, but the state variable itself `violationState` is not read anywhere.
    // I can just remove the variable from destructuring: `const [, setViolationState] = ...`

    const [isViolation, setIsViolation] = useState(false);
    const [violationText, setViolationText] = useState("");

    // Speech detection state
    const speechStartTimeRef = useRef(0);
    const speechBurstHistoryRef = useRef<number[]>([]);

    // Object detection state
    const lastObjectCheckRef = useRef(0);
    const isMobileDetectedRef = useRef(false);

    // Initialize ML models
    useEffect(() => {
        const initModels = async () => {
            try {
                // Load COCO-SSD for object detection
                const cocoSsd = await window.cocoSsd.load();
                setObjectDetector(cocoSsd);

                // Load FaceMesh
                const FaceMesh = window.FaceMesh;
                const faceMeshInstance = new FaceMesh({
                    locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
                });

                faceMeshInstance.setOptions({
                    maxNumFaces: 4,
                    refineLandmarks: true,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5,
                });

                faceMeshInstance.onResults(handleFaceMeshResults);
                setFaceMesh(faceMeshInstance);

            } catch (err) {
                console.error("Failed to load ML models:", err);
                onError?.("Failed to initialize proctoring system. Please refresh the page.");
            }
        };

        if (window.cocoSsd && window.FaceMesh && !faceMesh) {
            initModels();
        } else if (!window.cocoSsd || !window.FaceMesh) {
            // Retry or assume scripts loading? Logic in SystemCheck handled loading. 
            // We'll rely on global availability.
            initModels();
        }
    }, []);

    // Setup video and audio
    useEffect(() => {
        if (!videoRef.current || !stream || !faceMesh) return;

        const video = videoRef.current;
        video.srcObject = stream;

        // Setup audio analysis
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = ctx.createMediaStreamSource(stream);
        const analyserNode = ctx.createAnalyser();
        analyserNode.fftSize = 1024;
        source.connect(analyserNode);

        setAudioContext(ctx);
        setAnalyser(analyserNode);

        // Start camera processing
        video.onloadedmetadata = () => {
            video.play();

            if (canvasRef.current) {
                canvasRef.current.width = video.videoWidth;
                canvasRef.current.height = video.videoHeight;
            }

            // Start MediaPipe camera
            const Camera = window.Camera;
            const cam = new Camera(video, {
                onFrame: async () => {
                    // Run object detection occasionally (every 500ms)
                    const now = Date.now();
                    if (now - lastObjectCheckRef.current > 500 && objectDetector) {
                        lastObjectCheckRef.current = now;
                        const predictions = await objectDetector.detect(video);
                        isMobileDetectedRef.current = predictions.some((p: any) => p.class === "cell phone");
                    }

                    // Run face mesh every frame
                    await faceMesh.send({ image: video });
                },
                width: 640,
                height: 480,
            });

            cam.start();
            setCamera(cam);
        };

        return () => {
            if (camera) {
                camera.stop();
            }
            if (audioContext) {
                audioContext.close();
            }
        };
    }, [stream, faceMesh, objectDetector]);

    // Periodic submission
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const update: SessionReportUpdate = {
                    headsTurned: violationCounts.HEAD_TURNED,
                    headTilts: violationCounts.HEAD_TILT,
                    lookAways: violationCounts.GAZE_AWAY,
                    multiplePeople: violationCounts.MULTIPLE_PEOPLE,
                    faceVisibilityIssues: violationCounts.FACE_VISIBILITY,
                    mobileDetected: violationCounts.MOBILE_DETECTED,
                    audioIncidents: violationCounts.AUDIO_DETECTED,
                };

                await testApi.updateSessionReport(attemptId, update);
            } catch (err) {
                console.error("Failed to update session report:", err);
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [attemptId, violationCounts]);

    // ... (analyzeFace, getFaceBounds, detectSpeech, handleFaceMeshResults, updateViolationStats remain same)

    // RE-INSERT Helper functions to ensure they are present in replacement
    const analyzeFace = (landmarks: any[]): string[] => {
        if (!landmarks || landmarks.length === 0) return ["NO_FACE"];
        const face = landmarks;
        const currentViolations: string[] = [];
        const nose = face[1];
        const leftEyeOuter = face[33];
        const leftEyeInner = face[133];
        const rightEyeInner = face[362];
        const rightEyeOuter = face[263];

        // 1. HEAD ORIENTATION
        const dx = rightEyeOuter.x - leftEyeOuter.x;
        const dy = rightEyeOuter.y - leftEyeOuter.y;
        const rollAngle = Math.atan2(dy, dx) * 180 / Math.PI;
        if (Math.abs(rollAngle) > 20) currentViolations.push("HEAD_TILT");

        const eyesMidX = (leftEyeOuter.x + rightEyeOuter.x) / 2;
        const eyeDistance = Math.sqrt(dx * dx + dy * dy);
        const noseOffsetX = (nose.x - eyesMidX) / eyeDistance;
        if (Math.abs(noseOffsetX) > 0.35) currentViolations.push("HEAD_TURNED");

        // 2. GAZE
        if (face[468] && face[473]) {
            const leftIris = face[468];
            const rightIris = face[473];
            const leftEyeWidth = Math.abs(leftEyeInner.x - leftEyeOuter.x);
            const leftEyeMid = (leftEyeInner.x + leftEyeOuter.x) / 2;
            const leftGazeOffset = (leftIris.x - leftEyeMid) / leftEyeWidth;
            const rightEyeWidth = Math.abs(rightEyeOuter.x - rightEyeInner.x);
            const rightEyeMid = (rightEyeInner.x + rightEyeOuter.x) / 2;
            const rightGazeOffset = (rightIris.x - rightEyeMid) / rightEyeWidth;
            if (Math.abs(leftGazeOffset) > 0.6 || Math.abs(rightGazeOffset) > 0.6) {
                currentViolations.push("GAZE_AWAY");
            }
        }

        // 3. VISIBILITY/SIZE
        const faceBounds = getFaceBounds(face);
        const faceSize = faceBounds.width;
        if (faceSize < 0.1 || faceSize > 0.8) currentViolations.push("FACE_VISIBILITY");

        return currentViolations;
    };

    const getFaceBounds = (landmarks: any[]) => {
        let minX = 1, minY = 1, maxX = 0, maxY = 0;
        for (const landmark of landmarks) {
            minX = Math.min(minX, landmark.x);
            minY = Math.min(minY, landmark.y);
            maxX = Math.max(maxX, landmark.x);
            maxY = Math.max(maxY, landmark.y);
        }
        return { width: maxX - minX, height: maxY - minY };
    };

    const detectSpeech = (): boolean => {
        if (!analyser) return false;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);
        const binSize = (audioContext?.sampleRate || 48000) / analyser.fftSize;
        const startBin = Math.floor(300 / binSize);
        const endBin = Math.floor(3400 / binSize);
        let voiceEnergy = 0;
        for (let i = startBin; i <= endBin; i++) {
            voiceEnergy += dataArray[i];
        }
        const averageVoiceEnergy = voiceEnergy / (endBin - startBin + 1);
        return averageVoiceEnergy > 45;
    };

    const handleFaceMeshResults = (results: any) => {
        const currentViolations = new Set<string>();
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            if (results.multiFaceLandmarks.length > 1) currentViolations.add("MULTIPLE_PEOPLE");
            for (const landmarks of results.multiFaceLandmarks) {
                const violations = analyzeFace(landmarks);
                violations.forEach((v) => currentViolations.add(v));
            }
        }
        if (isMobileDetectedRef.current) currentViolations.add("MOBILE_DETECTED");

        const isSpeech = detectSpeech();
        const now = Date.now();
        if (isSpeech) {
            if (speechStartTimeRef.current === 0) speechStartTimeRef.current = now;
            if (now - speechStartTimeRef.current > 2000) currentViolations.add("AUDIO_DETECTED");
        } else {
            if (speechStartTimeRef.current > 0) {
                const duration = now - speechStartTimeRef.current;
                if (duration > 500) speechBurstHistoryRef.current.push(now);
                speechStartTimeRef.current = 0;
            }
        }
        speechBurstHistoryRef.current = speechBurstHistoryRef.current.filter((t) => now - t < 10000);
        if (speechBurstHistoryRef.current.length >= 3) currentViolations.add("AUDIO_DETECTED");

        updateViolationStats(currentViolations);
    };

    const updateViolationStats = (activeViolations: Set<string>) => {
        let hasViolation = false;
        let alertText = "";

        setViolationState((prevState) => {
            const newState = { ...prevState };
            const newCounts = { ...violationCounts };

            for (const type in newState) {
                const violationType = type as keyof ViolationCounts;

                if (activeViolations.has(type)) {
                    hasViolation = true;
                    if (type === "AUDIO_DETECTED") alertText = "SPEECH DETECTED";
                    else if (type === "MOBILE_DETECTED") alertText = "PHONE DETECTED";
                    else alertText = type.replace("_", " ");

                    if (!newState[violationType].active) {
                        newState[violationType].active = true;
                        newCounts[violationType]++;
                    }
                } else {
                    newState[violationType].active = false;
                }
            }
            setViolationCounts(newCounts);
            return newState;
        });

        setIsViolation(hasViolation);
        setViolationText(alertText);
    };

    return (
        <div className={`relative ${className}`}>
            {/* Camera Widget */}
            <div
                className={`w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg border-2 transition-all duration-300 ${isViolation ? "border-red-600" : "border-gray-800"
                    }`}
            >
                {isViolation && (
                    <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold z-10 animate-pulse">
                        {violationText}
                    </div>
                )}

                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1]"
                />

                <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Stats Display */}
            <div className="mt-2 bg-surface rounded-lg shadow border border-border p-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Head:</span>
                        <span className={violationCounts.HEAD_TURNED + violationCounts.HEAD_TILT > 0 ? "text-red-600 font-bold" : "text-gray-700"}>
                            {violationCounts.HEAD_TURNED + violationCounts.HEAD_TILT}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Gaze:</span>
                        <span className={violationCounts.GAZE_AWAY > 0 ? "text-blue-600 font-bold" : "text-gray-700"}>
                            {violationCounts.GAZE_AWAY}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">People:</span>
                        <span className={violationCounts.MULTIPLE_PEOPLE > 0 ? "text-purple-600 font-bold" : "text-gray-700"}>
                            {violationCounts.MULTIPLE_PEOPLE}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Mobile:</span>
                        <span className={violationCounts.MOBILE_DETECTED > 0 ? "text-orange-600 font-bold" : "text-gray-700"}>
                            {violationCounts.MOBILE_DETECTED}
                        </span>
                    </div>
                    <div className="flex justify-between col-span-2 border-t pt-1 mt-1">
                        <span className="text-gray-500">Audio:</span>
                        <span className={violationCounts.AUDIO_DETECTED > 0 ? "text-red-600 font-bold" : "text-gray-700"}>
                            {violationCounts.AUDIO_DETECTED}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProctoringManager;
