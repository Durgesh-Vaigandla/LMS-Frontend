import React, { useCallback, useEffect, useRef, useState } from "react";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { proctoringModelLoader } from "../../utils/ProctoringModelLoader";
import { testApi } from "../../services/testApi";
import type { SessionReportUpdate, ViolationCounts, ViolationType } from "../../types/proctoring";

// Note: TensorFlow is initialized by ProctoringModelLoader.loadModels()
// No need to initialize here to avoid HMR re-registration warnings

interface ProctoringManagerProps {
    stream: MediaStream;
    attemptId: number;
    testId?: number;
    testTitle?: string;
    maxViolations?: number; // Default: 3
    onError?: (error: string) => void;
    onStatusChange?: (status: { faceVisible: boolean; hasMultipleFaces: boolean; isLookingAway: boolean }) => void;
    onMaxViolationsReached?: () => void; // Callback when max violations reached
    className?: string; // Add className to interface
}

const ProctoringManager: React.FC<ProctoringManagerProps> = ({
    stream,
    attemptId,
    testId,
    testTitle,
    maxViolations = 3,
    onError,
    onStatusChange,
    onMaxViolationsReached,
    className = "",
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const requestRef = useRef<number>(0);
    // Use a ref to hold the model, but we fetch it from singleton
    const modelRef = useRef<faceLandmarksDetection.FaceLandmarksDetector | null>(null);
    const objectDetectorRef = useRef<cocoSsd.ObjectDetection | null>(null);

    // Audio Context
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    // Advanced Audio Tracking State
    const speechStartTimeRef = useRef<number>(0);
    const speechBurstHistoryRef = useRef<number[]>([]);

    // Object Detection State
    const lastObjectCheckRef = useRef<number>(0);
    const isMobileDetectedRef = useRef<boolean>(false);

    // Violation State Refs (to avoid closure staleness in loop)
    const violationCountsRef = useRef<ViolationCounts>({
        HEAD_TURNED: 0,
        HEAD_TILT: 0,
        GAZE_AWAY: 0,
        MULTIPLE_PEOPLE: 0,
        FACE_VISIBILITY: 0,
        MOBILE_DETECTED: 0,
        AUDIO_DETECTED: 0,
    });
    const activeViolationsRef = useRef<Set<ViolationType>>(new Set());
    const reportTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isReportingRef = useRef(false);

    // Throttling
    const lastCheckRef = useRef<number>(0);
    const CHECK_INTERVAL = 500; // Run AI check every 500ms

    // UI State
    const [isModelLoading, setIsModelLoading] = useState(true);
    const [violationCounts, setViolationCounts] = useState<ViolationCounts>(violationCountsRef.current);
    const [isViolation, setIsViolation] = useState(false);
    const [violationText, setViolationText] = useState("");
    const [totalViolations, setTotalViolations] = useState(0);
    const maxViolationsReachedRef = useRef(false);

    const buildSessionReport = useCallback((counts: ViolationCounts): SessionReportUpdate => ({
        headsTurned: counts.HEAD_TURNED,
        headTilts: counts.HEAD_TILT,
        lookAways: counts.GAZE_AWAY,
        multiplePeople: counts.MULTIPLE_PEOPLE,
        faceVisibilityIssues: counts.FACE_VISIBILITY,
        mobileDetected: counts.MOBILE_DETECTED,
        audioIncidents: counts.AUDIO_DETECTED,
    }), []);

    const flushSessionReport = useCallback(async () => {
        if (!attemptId || attemptId <= 0 || isReportingRef.current) return;
        isReportingRef.current = true;
        try {
            await testApi.updateSessionReport(attemptId, buildSessionReport(violationCountsRef.current));
        } catch (err) {
            console.error("Failed to update session report", err);
        } finally {
            isReportingRef.current = false;
        }
    }, [attemptId, buildSessionReport]);

    const scheduleSessionReport = useCallback(() => {
        if (!attemptId || attemptId <= 0) return;
        if (reportTimerRef.current) clearTimeout(reportTimerRef.current);
        reportTimerRef.current = setTimeout(() => {
            reportTimerRef.current = null;
            flushSessionReport();
        }, 2000);
    }, [attemptId, flushSessionReport]);

    const updateViolations = useCallback((activeViolations: Set<ViolationType>, facesCount: number = 0) => {
        const previousViolations = activeViolationsRef.current;
        let countsChanged = false;

        activeViolations.forEach((type) => {
            if (!previousViolations.has(type)) {
                violationCountsRef.current[type] += 1;
                countsChanged = true;
            }
        });

        activeViolationsRef.current = new Set(activeViolations);

        if (activeViolations.size > 0) {
            const priority: Array<[ViolationType, string]> = [
                ["FACE_VISIBILITY", "FACE NOT VISIBLE"],
                ["MULTIPLE_PEOPLE", facesCount > 2 ? `${facesCount} PEOPLE DETECTED` : "MULTIPLE FACES"],
                ["AUDIO_DETECTED", "NOISE DETECTED"],
                ["HEAD_TURNED", "LOOKING AWAY"],
                ["HEAD_TILT", "HEAD TILT"],
                ["GAZE_AWAY", "GAZE AWAY"],
                ["MOBILE_DETECTED", "MOBILE DETECTED"],
            ];
            const label = priority.find(([type]) => activeViolations.has(type))?.[1] || "VIOLATION DETECTED";
            setIsViolation(true);
            setViolationText(label);
        } else {
            setIsViolation(false);
            setViolationText("");
        }

        if (countsChanged) {
            // Calculate total violations
            const total = Object.values(violationCountsRef.current).reduce((sum, count) => sum + count, 0);
            setTotalViolations(total);
            setViolationCounts({ ...violationCountsRef.current });
            scheduleSessionReport();
            
            // Check if max violations reached
            if (total >= maxViolations && !maxViolationsReachedRef.current) {
                maxViolationsReachedRef.current = true;
                console.error(`🚨 MAX VIOLATIONS REACHED: ${total}/${maxViolations}`);
                if (onMaxViolationsReached) {
                    onMaxViolationsReached();
                }
            }
        }
    }, [scheduleSessionReport, maxViolations, onMaxViolationsReached]);

    // Initialize Audio Analysis
    useEffect(() => {
        if (!stream) return;

        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioCtx.createAnalyser();
            const source = audioCtx.createMediaStreamSource(stream);

            source.connect(analyser);
            analyser.fftSize = 256;

            audioContextRef.current = audioCtx;
            analyserRef.current = analyser;
            audioSourceRef.current = source;
        } catch (err) {
            console.error("Audio init failed:", err);
        }

        return () => {
            audioContextRef.current?.close();
        };
    }, [stream]);

    // Initialize TensorFlow Model (via Singleton)
    useEffect(() => {
        let isMounted = true;

        const initModel = async () => {
            // Check if already loaded synchronously
            const existingModel = proctoringModelLoader.getModel();
            if (existingModel) {
                console.log("\u2705 Using cached model instance");
                modelRef.current = existingModel;
                setIsModelLoading(false);
                return;
            }

            // Otherwise load/wait
            try {
                console.log("🧪 Testing model...");
                const model = await proctoringModelLoader.loadModel();
                if (isMounted) {
                    modelRef.current = model;
                    console.log("✅ Model ready for face detection");
                    console.log("✅ Model has methods:", Object.keys(model).join(", "));
                    console.log("✅ estimateFaces type:", typeof model.estimateFaces);
                    
                    // Load COCO-SSD for mobile detection
                    console.log("📱 Loading COCO-SSD for object detection...");
                    try {
                        const objectDetector = await cocoSsd.load();
                        objectDetectorRef.current = objectDetector;
                        console.log("✅ COCO-SSD loaded for mobile detection");
                    } catch (objErr) {
                        console.warn("⚠️ Failed to load COCO-SSD, mobile detection disabled:", objErr);
                    }
                    
                    setIsModelLoading(false);
                }
            } catch (err) {
                console.error("❌ Failed to load AI model:", err);
                if (isMounted) {
                    setIsModelLoading(false);
                    if (onError) onError("Failed to load AI model: " + (err as Error).message);
                }
            }
        };

        // Start loading immediately
        initModel();

        return () => {
            isMounted = false;
        };
    }, [onError]);

    // Display stream immediately (UI Fix: Camera turns on instantly)
    useEffect(() => {
        if (!stream || !videoRef.current) return;
        
        const video = videoRef.current;
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;
        
        const tryPlay = () => {
            video.play()
                .then(() => {
                    console.log("\u2705 Video playing successfully");
                    console.log("Video dimensions:", video.videoWidth, "x", video.videoHeight);
                    console.log("Video ready state:", video.readyState);
                })
                .catch(e => {
                    console.error("❌ Video play failed:", e);
                    if (onError) onError("Failed to play video stream");
                });
        };
        
        if (video.readyState >= 2) {
            console.log("\u2705 Video ready (readyState=", video.readyState, "), starting playback");
            tryPlay();
        } else {
            video.onloadedmetadata = () => {
                console.log("\u2705 Video metadata loaded");
                console.log("Video dimensions:", video.videoWidth, "x", video.videoHeight);
                tryPlay();
            };
        }
        
        return () => {
            video.srcObject = null;
        };
    }, [stream, onError]);

    // Monitoring Loop (AI Logic)
    useEffect(() => {
        if (!stream || !videoRef.current || isModelLoading) {
            console.log("⏳ Waiting for prerequisites: stream=", !!stream, "video=", !!videoRef.current, "modelLoaded=", !isModelLoading);
            return;
        }

        console.log("✅ Starting face detection monitoring loop");
        let firstDetectionLogged = false;
        let videoReadyLogged = false;

        const checkFrame = async (timestamp: number) => {
            const video = videoRef.current;
            if (!modelRef.current || !video || video.paused || video.ended) {
                requestRef.current = requestAnimationFrame(checkFrame);
                return;
            }

            if (video.videoWidth === 0 || video.videoHeight === 0) {
                if (!videoReadyLogged) {
                    console.warn("⏳ Video not ready yet, dimensions:", video.videoWidth, "x", video.videoHeight);
                    videoReadyLogged = true;
                }
                requestRef.current = requestAnimationFrame(checkFrame);
                return;
            }
            
            // Log when video becomes ready
            if (!videoReadyLogged) {
                console.log("✅ Video ready for detection:", {
                    width: video.videoWidth,
                    height: video.videoHeight,
                    readyState: video.readyState,
                    paused: video.paused
                });
                videoReadyLogged = true;
            }

            // Throttle checks
            if (timestamp - lastCheckRef.current < CHECK_INTERVAL) {
                requestRef.current = requestAnimationFrame(checkFrame);
                return;
            }
            lastCheckRef.current = timestamp;

            const activeViolations = new Set<ViolationType>();
            const now = Date.now();

            // 1. Advanced Audio Check (Speech Detection)
            if (analyserRef.current && audioContextRef.current) {
                const analyser = analyserRef.current;
                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                analyser.getByteFrequencyData(dataArray);

                // Filter for Voice Frequency Range (300Hz - 3400Hz)
                const sampleRate = audioContextRef.current.sampleRate;
                const binSize = sampleRate / analyser.fftSize;
                const startBin = Math.floor(300 / binSize);
                const endBin = Math.floor(3400 / binSize);

                let voiceEnergy = 0;
                let binCount = 0;
                for (let i = startBin; i <= endBin; i++) {
                    if (dataArray[i]) {
                        voiceEnergy += dataArray[i];
                        binCount++;
                    }
                }
                const averageVoiceEnergy = binCount > 0 ? voiceEnergy / binCount : 0;
                const isSpeech = averageVoiceEnergy > 45; // Threshold from index.html

                if (isSpeech) {
                    if (speechStartTimeRef.current === 0) speechStartTimeRef.current = now;
                    // Continuous Speech > 2 seconds
                    if (now - speechStartTimeRef.current > 2000) {
                        activeViolations.add("AUDIO_DETECTED");
                    }
                } else {
                    if (speechStartTimeRef.current > 0) {
                        const duration = now - speechStartTimeRef.current;
                        if (duration > 500) {
                            speechBurstHistoryRef.current.push(now);
                        }
                        speechStartTimeRef.current = 0;
                    }
                }

                // Burst Logic: 3+ bursts in 10 seconds
                speechBurstHistoryRef.current = speechBurstHistoryRef.current.filter(t => now - t < 10000);
                if (speechBurstHistoryRef.current.length >= 3) {
                    activeViolations.add("AUDIO_DETECTED");
                }
            }

            // 1b. Object Detection (Mobile Phone) - Run occasionally (every ~500ms)
            if (objectDetectorRef.current && now - lastObjectCheckRef.current > 500) {
                lastObjectCheckRef.current = now;
                try {
                    const predictions = await objectDetectorRef.current.detect(video);
                    
                    // Log all detections for debugging (first time only)
                    if (Math.random() < 0.1) { // Log 10% of the time
                        console.log("📱 Object Detection Results:", predictions.map(p => ({ 
                            class: p.class, 
                            score: (p.score * 100).toFixed(1) + '%' 
                        })));
                    }
                    
                    // Check for 'cell phone' class
                    const mobileDetection = predictions.find(p => p.class === 'cell phone');
                    const isMobileDetected = mobileDetection && mobileDetection.score > 0.5;
                    
                    if (isMobileDetected && !isMobileDetectedRef.current) {
                        console.warn("🚨 MOBILE PHONE DETECTED! Score:", (mobileDetection.score * 100).toFixed(1) + '%');
                    }
                    
                    isMobileDetectedRef.current = !!isMobileDetected;
                    if (isMobileDetected) {
                        activeViolations.add("MOBILE_DETECTED");
                    }
                } catch (objErr) {
                    console.error("❌ Object detection error:", objErr);
                }
            } else if (isMobileDetectedRef.current) {
                // Keep the violation active if mobile was previously detected
                activeViolations.add("MOBILE_DETECTED");
            }


            let isLookingAwayVal = false;
            let detectedFacesCount = 0;

            // 2. Face Analysis (MediaPipe)
            try {
                if (!modelRef.current) {
                    console.error("❌ Model ref is null during detection");
                    requestRef.current = requestAnimationFrame(checkFrame);
                    return;
                }
                
                // Log every 100 frames (every 50 seconds at 500ms intervals)
                const shouldLog = !firstDetectionLogged || Math.random() < 0.01;
                
                if (shouldLog) {
                    console.log("🔍 Running face detection...", {
                        videoWidth: video.videoWidth,
                        videoHeight: video.videoHeight,
                        videoPaused: video.paused,
                        videoReadyState: video.readyState,
                        modelExists: !!modelRef.current,
                        timestamp: new Date().toISOString()
                    });
                }
                
                let faces;
                try {
                    // Try detection with default config
                    faces = await modelRef.current.estimateFaces(video, { 
                        flipHorizontal: false,
                        staticImageMode: false
                    });
                    
                    // If no faces found and it's early attempts, try with flipHorizontal
                    if ((!faces || faces.length === 0) && !firstDetectionLogged) {
                        console.log("🔄 No faces found, trying with flipHorizontal=true...");
                        faces = await modelRef.current.estimateFaces(video, { 
                            flipHorizontal: true,
                            staticImageMode: false
                        });
                    }
                } catch (detectionError) {
                    console.error("❌ Error during estimateFaces call:", detectionError);
                    throw detectionError;
                }
                
                if (shouldLog) {
                    console.log("📊 Detection result:", {
                        facesFound: faces?.length || 0,
                        facesIsArray: Array.isArray(faces),
                        facesType: typeof faces,
                        multipleFaces: (faces?.length || 0) > 1,
                        firstFaceBox: faces?.[0]?.box,
                        secondFaceBox: faces?.[1]?.box
                    });
                    
                    // Log details of each face if multiple detected
                    if (faces && faces.length > 1) {
                        console.log("🚨 MULTIPLE FACES DETAILS:");
                        faces.forEach((face, idx) => {
                            console.log(`  Face ${idx + 1}:`, {
                                box: face.box,
                                keypointsCount: face.keypoints?.length
                            });
                        });
                    }
                }
                
                if (!firstDetectionLogged) {
                    console.log("✅ First face detection completed. Faces found:", faces?.length || 0);
                    console.log("Video state:", {
                        width: video.videoWidth,
                        height: video.videoHeight,
                        paused: video.paused,
                        ended: video.ended,
                        readyState: video.readyState
                    });
                    if (faces && faces.length > 0) {
                        console.log("✅ Sample face data:", faces[0]);
                        console.log("Keypoints count:", faces[0].keypoints?.length);
                        if (faces.length > 1) {
                            console.log("🚨 MULTIPLE FACES DETECTED:", faces.length, "faces");
                        }
                    } else {
                        console.warn("⚠️ No faces detected on first attempt!");
                    }
                    firstDetectionLogged = true;
                }

                if (faces && faces.length > 0) {
                    detectedFacesCount = faces.length;
                    
                    // Check for multiple faces first
                    if (faces.length > 1) {
                        console.log("🚨 MULTIPLE PEOPLE DETECTED:", faces.length, "faces in frame");
                        activeViolations.add("MULTIPLE_PEOPLE");
                    }

                    // Analyze Primary Face
                    const face = faces[0];
                    const keypoints = face.keypoints;

                    // CRITICAL: Face Completeness Check to prevent cheating
                    // Check if both eyes, nose, and mouth are visible
                    const leftEye = keypoints.find(k => k.name === "leftEye") || keypoints[33];
                    const rightEye = keypoints.find(k => k.name === "rightEye") || keypoints[263];
                    const nose = keypoints.find(k => k.name === "noseTip") || keypoints[1];
                    const leftMouth = keypoints.find(k => k.name === "mouthLeft") || keypoints[61];
                    const rightMouth = keypoints.find(k => k.name === "mouthRight") || keypoints[291];
                    
                    // Check if critical landmarks exist
                    const hasLeftEye = leftEye && leftEye.x > 0 && leftEye.y > 0;
                    const hasRightEye = rightEye && rightEye.x > 0 && rightEye.y > 0;
                    const hasNose = nose && nose.x > 0 && nose.y > 0;
                    const hasMouth = (leftMouth && leftMouth.x > 0) || (rightMouth && rightMouth.x > 0);
                    
                    // If critical facial features are missing, flag as incomplete face
                    if (!hasLeftEye || !hasRightEye || !hasNose || !hasMouth) {
                        console.warn("⚠️ Incomplete face detected (missing eyes/nose/mouth). Possible occlusion or hand covering!");
                        activeViolations.add("FACE_VISIBILITY");
                        // Still process but keep the violation active
                    }

                    const leftEyeOuter = leftEye;
                    const rightEyeOuter = rightEye;

                    if (nose && leftEyeOuter && rightEyeOuter) {
                        // A. HEAD ORIENTATION (TILT/ROLL)
                        const dx = rightEyeOuter.x - leftEyeOuter.x;
                        const dy = rightEyeOuter.y - leftEyeOuter.y;
                        const rollAngle = Math.atan2(dy, dx) * (180 / Math.PI);

                        if (Math.abs(rollAngle) > 25) { // Increased from 20 to 25 degrees
                            activeViolations.add("HEAD_TILT");
                        }

                        // B. HEAD TURN (YAW) via Nose Offset
                        const eyeDistance = Math.sqrt(dx * dx + dy * dy);
                        const eyesMidX = (leftEyeOuter.x + rightEyeOuter.x) / 2;
                        const noseOffsetX = (nose.x - eyesMidX) / eyeDistance;

                        if (Math.abs(noseOffsetX) > 0.45) { // More lenient: increased from 0.35 to 0.45
                            activeViolations.add("HEAD_TURNED");
                            isLookingAwayVal = true;
                        }

                        // C. GAZE DETECTION (Iris Tracking)
                        const leftIris = keypoints[468];
                        const rightIris = keypoints[473];
                        const leftEyeInner = keypoints[133];
                        const rightEyeInner = keypoints[362];

                        if (leftIris && rightIris && leftEyeInner && rightEyeInner) {
                            const leftEyeWidth = Math.abs(leftEyeInner.x - leftEyeOuter.x);
                            const leftEyeMid = (leftEyeInner.x + leftEyeOuter.x) / 2;
                            const leftGazeOffset = (leftIris.x - leftEyeMid) / leftEyeWidth;

                            const rightEyeWidth = Math.abs(rightEyeOuter.x - rightEyeInner.x);
                            const rightEyeMid = (rightEyeInner.x + rightEyeOuter.x) / 2;
                            const rightGazeOffset = (rightIris.x - rightEyeMid) / rightEyeWidth;

                            // More lenient gaze threshold: increased from 0.6 to 0.85
                            if (Math.abs(leftGazeOffset) > 0.85 || Math.abs(rightGazeOffset) > 0.85) {
                                activeViolations.add("GAZE_AWAY");
                                isLookingAwayVal = true;
                            }
                        }

                        // D. FACE SIZE / DISTANCE & ASPECT RATIO CHECK
                        let minX = video.videoWidth, maxX = 0;
                        let minY = video.videoHeight, maxY = 0;
                        keypoints.forEach(k => {
                            if (k.x < minX) minX = k.x;
                            if (k.x > maxX) maxX = k.x;
                            if (k.y < minY) minY = k.y;
                            if (k.y > maxY) maxY = k.y;
                        });
                        const faceWidthPx = maxX - minX;
                        const faceHeightPx = maxY - minY;
                        const faceRatio = faceWidthPx / video.videoWidth;
                        const aspectRatio = faceWidthPx / faceHeightPx;
                        
                        // Check face size (too small or too large)
                        if (faceRatio < 0.1 || faceRatio > 0.8) {
                            activeViolations.add("FACE_VISIBILITY");
                        }
                        
                        // Check aspect ratio - normal face should be roughly 0.6-1.0
                        // If aspect ratio is off, might be partially covered
                        if (aspectRatio < 0.5 || aspectRatio > 1.3) {
                            console.warn("⚠️ Abnormal face aspect ratio detected:", aspectRatio, "- possible partial coverage!");
                            activeViolations.add("FACE_VISIBILITY");
                        }
                        
                        // Check if face bounding box is too small in pixels (absolute check)
                        const minFaceSize = 80; // Minimum 80px width
                        if (faceWidthPx < minFaceSize || faceHeightPx < minFaceSize) {
                            console.warn("⚠️ Face too small in frame:", faceWidthPx, "x", faceHeightPx, "px");
                            activeViolations.add("FACE_VISIBILITY");
                        }
                    }
                } else {
                    activeViolations.add("FACE_VISIBILITY");
                    if (Math.random() < 0.05) { // Log 5% of the time
                        console.warn("⚠️ No faces detected in current frame");
                    }
                }

                if (onStatusChange) {
                    onStatusChange({
                        faceVisible: faces && faces.length > 0,
                        hasMultipleFaces: faces && faces.length > 1,
                        isLookingAway: isLookingAwayVal
                    });
                }

            } catch (err) {
                console.error("❌ Face detection error:", err);
                console.error("Error details:", {
                    message: (err as Error).message,
                    stack: (err as Error).stack,
                    modelExists: !!modelRef.current,
                    videoExists: !!video,
                    videoWidth: video?.videoWidth,
                    videoHeight: video?.videoHeight
                });
            }

            updateViolations(activeViolations, detectedFacesCount);
            requestRef.current = requestAnimationFrame(checkFrame);
        };

        requestRef.current = requestAnimationFrame(checkFrame);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (reportTimerRef.current) clearTimeout(reportTimerRef.current);
            flushSessionReport();
        };
    }, [stream, isModelLoading, onStatusChange, updateViolations, flushSessionReport]);

    // Removing old isLookingAway helper as it is integrated now
    // const isLookingAway = ...

    return (
        <div className={`relative ${className}`}>
            {/* Camera Widget */}
            <div
                className={`w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg border-2 transition-all duration-300 ${isViolation ? "border-red-600 animate-pulse" : "border-gray-800"
                    }`}
            >
                {isViolation && (
                    <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold z-10">
                        {violationText}
                    </div>
                )}

                {/* Loading Badge (Non-blocking) */}
                {isModelLoading && (
                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur text-white px-2 py-1 rounded text-xs flex items-center z-20 border border-white/10">
                        <svg className="animate-spin -ml-0.5 mr-2 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Initializing AI...
                    </div>
                )}

                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1]"
                />
            </div>

            {/* Stats Display */}
            <div className="mt-2 bg-surface rounded-lg shadow border border-border p-2 text-xs">
                {/* Test Info */}
                {(testId || testTitle) && (
                    <div className="mb-2 pb-2 border-b border-border">
                        {testTitle && (
                            <div className="font-semibold text-gray-800 mb-1 truncate">{testTitle}</div>
                        )}
                        {testId && (
                            <div className="text-gray-500 text-[10px]">
                                Test ID: <span className="font-mono text-gray-700">{testId}</span> | Attempt ID: <span className="font-mono text-gray-700">{attemptId}</span>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Total Violations Counter */}
                <div className={`mb-2 pb-2 border-b border-border flex justify-between items-center ${totalViolations >= maxViolations ? 'bg-red-50 -m-2 p-2 mb-0' : ''}`}>
                    <span className="font-semibold text-gray-700">Total Violations:</span>
                    <span className={`font-bold text-lg ${totalViolations >= maxViolations ? 'text-red-600 animate-pulse' : totalViolations >= maxViolations - 1 ? 'text-orange-600' : 'text-gray-800'}`}>
                        {totalViolations} / {maxViolations}
                    </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Head/Face:</span>
                        <span className={(violationCounts.HEAD_TURNED + violationCounts.FACE_VISIBILITY) > 0 ? "text-red-600 font-bold" : "text-gray-700"}>
                            {violationCounts.HEAD_TURNED + violationCounts.FACE_VISIBILITY}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Audio:</span>
                        <span className={violationCounts.AUDIO_DETECTED > 0 ? "text-red-600 font-bold" : "text-gray-700"}>
                            {violationCounts.AUDIO_DETECTED}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Multiple:</span>
                        <span className={violationCounts.MULTIPLE_PEOPLE > 0 ? "text-purple-600 font-bold" : "text-gray-700"}>
                            {violationCounts.MULTIPLE_PEOPLE}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Gaze:</span>
                        <span className={violationCounts.GAZE_AWAY > 0 ? "text-blue-600 font-bold" : "text-gray-700"}>
                            {violationCounts.GAZE_AWAY}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProctoringManager;
