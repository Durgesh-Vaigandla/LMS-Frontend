/**
 * Test utility to verify face detection is working
 * Open browser console and run: window.testFaceDetection()
 */

import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import { initTF } from "./tfInit";

export async function testFaceDetection() {
    console.log("🧪 Starting Face Detection Test...");
    
    try {
        // 1. Test TensorFlow backend
        console.log("1️⃣ Testing TensorFlow backend...");
        await initTF();
        console.log("✅ TensorFlow backend ready");
        
        // 2. Load model
        console.log("2️⃣ Loading face detection model...");
        let model;
        try {
            // Try MediaPipe runtime first (same as working HTML)
            console.log("Trying MediaPipe runtime...");
            model = await faceLandmarksDetection.createDetector(
                faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
                {
                    runtime: "mediapipe",
                    refineLandmarks: true,
                    maxFaces: 4,
                    solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh",
                } as any
            );
            console.log("✅ Model loaded with MediaPipe runtime");
        } catch (err) {
            console.warn("MediaPipe failed, trying TFJS runtime:", err);
            model = await faceLandmarksDetection.createDetector(
                faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
                {
                    runtime: "tfjs",
                    refineLandmarks: true,
                    maxFaces: 4,
                }
            );
            console.log("✅ Model loaded with TFJS runtime");
        }
        console.log("Model methods:", Object.keys(model));
        
        // 3. Get video stream
        console.log("3️⃣ Requesting camera access...");
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 }
        });
        console.log("✅ Camera access granted");
        
        // 4. Create video element
        const video = document.createElement("video");
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        video.style.position = "fixed";
        video.style.top = "0";
        video.style.left = "0";
        video.style.width = "320px";
        video.style.height = "240px";
        video.style.zIndex = "9999";
        
        // Add to DOM (some models need this)
        document.body.appendChild(video);
        
        await new Promise<void>((resolve) => {
            video.onloadedmetadata = () => {
                video.play();
                console.log("✅ Video playing:", video.videoWidth, "x", video.videoHeight);
                resolve();
            };
        });
        
        // Wait a bit for video to stabilize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verify video is actually playing
        console.log("Video status before detection:", {
            width: video.videoWidth,
            height: video.videoHeight,
            readyState: video.readyState,
            paused: video.paused,
            currentTime: video.currentTime,
            duration: video.duration
        });
        
        // 5. Try face detection multiple times
        console.log("4️⃣ Running face detection...");
        
        let faces = null;
        let attempts = 0;
        const maxAttempts = 5;
        
        while (attempts < maxAttempts && (!faces || faces.length === 0)) {
            attempts++;
            console.log(`Attempt ${attempts}/${maxAttempts}...`);
            
            try {
                faces = await model.estimateFaces(video, { 
                    flipHorizontal: false,
                    staticImageMode: false
                });
                
                console.log(`Attempt ${attempts} result:`, {
                    facesFound: faces?.length || 0,
                    facesArray: faces
                });
                
                if (faces && faces.length > 0) {
                    break;
                }
                
                // Wait before next attempt
                if (attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            } catch (err) {
                console.error(`Attempt ${attempts} failed:`, err);
            }
        }
        
        console.log("✅ Face detection completed!");
        console.log("Faces detected:", faces?.length || 0);
        
        if (faces && faces.length > 0) {
            console.log("✅✅✅ SUCCESS! Face detected!");
            console.log("Face details:", {
                keypointsCount: faces[0].keypoints?.length,
                box: faces[0].box,
                sampleKeypoint: faces[0].keypoints?.[0]
            });
        } else {
            console.warn("⚠️ No faces detected. Possible issues:");
            console.warn("- Poor lighting");
            console.warn("- Face not in frame");
            console.warn("- Camera angle");
            console.warn("- Video not fully ready");
        }
        
        // Cleanup
        stream.getTracks().forEach(track => track.stop());
        if (video.parentElement) {
            document.body.removeChild(video);
        }
        
        return {
            success: faces && faces.length > 0,
            facesCount: faces?.length || 0,
            faces: faces,
            attempts: attempts
        };
        
    } catch (error) {
        console.error("❌ Test failed:", error);
        return {
            success: false,
            error: error
        };
    }
}

// Expose to window for easy testing
if (typeof window !== "undefined") {
    (window as any).testFaceDetection = testFaceDetection;
}
