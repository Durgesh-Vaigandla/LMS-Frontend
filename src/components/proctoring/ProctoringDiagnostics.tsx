import React from "react";
import ProctoringManager from "./ProctoringManager";

interface ProctoringDiagnosticsProps {
  stream: MediaStream | null;
  modelStatus: "loading" | "ready" | "error";
  onStatusChange: (status: { faceVisible: boolean; hasMultipleFaces: boolean; isLookingAway: boolean }) => void;
}

const ProctoringDiagnostics: React.FC<ProctoringDiagnosticsProps> = ({
  stream,
  modelStatus,
  onStatusChange,
}) => {
  if (!stream) {
    return <div className="text-gray-400 text-sm">Waiting for camera...</div>;
  }

  if (modelStatus === "loading") {
    return <div className="text-gray-400 text-sm">Loading proctoring model...</div>;
  }

  if (modelStatus === "error") {
    return <div className="text-red-500 text-sm">Failed to load proctoring model.</div>;
  }

  return (
    <ProctoringManager
      stream={stream}
      attemptId={0}
      onStatusChange={onStatusChange}
      className="w-full h-full"
    />
  );
};

export default ProctoringDiagnostics;
