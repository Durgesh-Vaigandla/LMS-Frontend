import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import { initTF } from "./tfInit";

class ProctoringModelLoader {
    private static instance: ProctoringModelLoader;
    private model: faceLandmarksDetection.FaceLandmarksDetector | null = null;
    private loadingPromise: Promise<faceLandmarksDetection.FaceLandmarksDetector> | null = null;

    private constructor() { }

    public static getInstance(): ProctoringModelLoader {
        if (!ProctoringModelLoader.instance) {
            ProctoringModelLoader.instance = new ProctoringModelLoader();
        }
        return ProctoringModelLoader.instance;
    }

    public async loadModel(timeoutMs: number = 60000): Promise<faceLandmarksDetection.FaceLandmarksDetector> {
        if (this.model) {
            console.log("✅ Model already loaded, returning cached instance");
            return this.model;
        }

        if (this.loadingPromise) {
            console.log("⏳ Model loading in progress, waiting...");
            return this.loadingPromise;
        }

        const loadPromise = (async () => {
            try {
                // Ensure TensorFlow is initialized first
                console.log("🔧 Ensuring TensorFlow backend is ready...");
                await initTF();
                
                console.log("📦 Loading Face Landmarks Detection Model...");
                console.log("Attempting with MediaPipe runtime (same as working HTML)...");
                
                let model;
                try {
                    // Use MediaPipe runtime (same as the working index.html)
                    model = await faceLandmarksDetection.createDetector(
                        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
                        {
                            runtime: "mediapipe",
                            refineLandmarks: true,
                            maxFaces: 4, // Detect up to 4 faces for multiple people detection
                            solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh",
                        } as any
                    );
                    console.log("✅ Model loaded with MediaPipe runtime (maxFaces: 4)");
                } catch (err) {
                    console.warn("⚠️ MediaPipe runtime failed, trying TFJS runtime:", err);
                    //Fallback to tfjs runtime
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
                
                // Test the model
                console.log("🧪 Testing model...");
                console.log("Model type:", typeof model);
                console.log("Model has estimateFaces:", typeof model.estimateFaces);
                
                this.model = model;
                console.log("✅ Face Landmarks Model Loaded Successfully!");
                console.log("✅ Model ready with estimateFaces method");
                return model;
            } catch (err) {
                console.error("❌ Failed to load FaceLandmarks model:", err);
                this.loadingPromise = null; // Allow retrying
                throw err;
            }
        })();

        const timeoutPromise = new Promise<faceLandmarksDetection.FaceLandmarksDetector>((_, reject) => {
            setTimeout(() => {
                reject(new Error("Proctoring model load timed out after " + (timeoutMs / 1000) + " seconds"));
            }, timeoutMs);
        });

        this.loadingPromise = Promise.race([loadPromise, timeoutPromise]).catch((err) => {
            this.loadingPromise = null;
            throw err;
        });

        return this.loadingPromise;
    }

    public getModel(): faceLandmarksDetection.FaceLandmarksDetector | null {
        return this.model;
    }
}

export const proctoringModelLoader = ProctoringModelLoader.getInstance();
