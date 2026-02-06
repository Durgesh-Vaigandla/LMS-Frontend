import React, { useEffect, useState } from "react";
import ProctoringDiagnostics from "../../../components/proctoring/ProctoringDiagnostics";
import { MediaStreamManager } from "../../../utils/MediaStreamManager";
import { proctoringModelLoader } from "../../../utils/ProctoringModelLoader";
import { initTF } from "../../../utils/tfInit";

const ProctoringTestPage: React.FC = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [modelStatus, setModelStatus] = useState<"loading" | "ready" | "error">("loading");
  const [status, setStatus] = useState<{ faceVisible: boolean; hasMultipleFaces: boolean; isLookingAway: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        console.log("\ud83d\udcf9 Requesting camera and microphone access...");
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          }, 
          audio: true 
        });
        
        if (!isMounted) {
          mediaStream.getTracks().forEach(track => track.stop());
          return;
        }
        
        console.log("\u2705 Media stream acquired successfully");
        setStream(mediaStream);
        MediaStreamManager.getInstance().setStream(mediaStream);
      } catch (err) {
        console.error("❌ Failed to access camera/mic:", err);
        if (!isMounted) return;
        setError("Failed to access camera or microphone. Please check permissions.");
      }
    };

    const initModel = async () => {
      try {
        // Initialize TensorFlow first
        console.log("\ud83d\udd27 Initializing TensorFlow backend...");
        await initTF();
        
        // Check if model already loaded
        if (proctoringModelLoader.getModel()) {
          console.log("\u2705 Model already loaded");
          if (isMounted) setModelStatus("ready");
          return;
        }

        // Load model
        setModelStatus("loading");
        console.log("\ud83d\udce6 Loading face detection model...");
        await proctoringModelLoader.loadModel();
        
        if (!isMounted) return;
        console.log("\u2705 Model loaded successfully");
        setModelStatus("ready");
        setModelError(null);
      } catch (err) {
        console.error("❌ Model initialization failed:", err);
        if (!isMounted) return;
        setModelStatus("error");
        setModelError((err as Error)?.message || "Model failed to load");
      }
    };

    // Start both initializations
    init();
    initModel();

    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-border p-6">
          <h1 className="text-2xl font-bold text-text">Proctoring Test Lab</h1>
          <p className="text-text-secondary mt-1">
            Use this page to validate camera access, model initialization, and face detection before using it with students.
          </p>
          <div className="mt-4">
            <button
              onClick={() => {
                console.log("🧪 Running diagnostic test...");
                if ((window as any).testFaceDetection) {
                  (window as any).testFaceDetection().then((result: any) => {
                    console.log("Test result:", result);
                    alert(result.success 
                      ? `✅ SUCCESS! Detected ${result.facesCount} face(s)` 
                      : "❌ Test failed. Check console for details.");
                  });
                } else {
                  alert("Test function not available. Reload the page.");
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              🧪 Run Diagnostics Test
            </button>
            <span className="ml-3 text-xs text-gray-500">Check browser console for detailed logs</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
            {error}
          </div>
        )}

        {modelStatus === "error" && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold">Model Loading Failed</p>
              <p className="text-sm mt-1">{modelError || "Proctoring model failed to load."}</p>
            </div>
            <button
              onClick={async () => {
                setModelStatus("loading");
                setModelError(null);
                try {
                  console.log("\ud83d\udd04 Retrying model load...");
                  await initTF();
                  await proctoringModelLoader.loadModel();
                  console.log("\u2705 Model loaded on retry");
                  setModelStatus("ready");
                } catch (err) {
                  console.error("❌ Retry failed:", err);
                  setModelStatus("error");
                  setModelError((err as Error)?.message || "Model failed to load");
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded text-sm font-semibold hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-border p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center border border-gray-300">
              <ProctoringDiagnostics
                stream={stream}
                modelStatus={modelStatus}
                onStatusChange={(next) => setStatus(next)}
              />
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Model Status</span>
                <span className={modelStatus === "ready" ? "text-green-600 font-semibold" : modelStatus === "error" ? "text-red-600 font-semibold" : "text-text-secondary"}>
                  {modelStatus}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Face Visible</span>
                <span className={status?.faceVisible ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                  {status?.faceVisible ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Multiple Faces</span>
                <span className={status?.hasMultipleFaces ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>
                  {status?.hasMultipleFaces ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Looking Away</span>
                <span className={status?.isLookingAway ? "text-yellow-600 font-semibold" : "text-green-600 font-semibold"}>
                  {status?.isLookingAway ? "Yes" : "No"}
                </span>
              </div>
              <div className="text-xs text-text-secondary">
                Tip: Ensure good lighting and face centered in the frame.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProctoringTestPage;
