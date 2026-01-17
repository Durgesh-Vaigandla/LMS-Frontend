// TypeScript definitions for ML Proctoring Libraries

declare global {
    interface Window {
        FaceMesh: any;
        Camera: any;
        cocoSsd: any;
    }
}

export interface ViolationCounts {
    HEAD_TURNED: number;
    HEAD_TILT: number;
    GAZE_AWAY: number;
    MULTIPLE_PEOPLE: number;
    FACE_VISIBILITY: number;
    MOBILE_DETECTED: number;
    AUDIO_DETECTED: number;
}

export interface SessionReportUpdate {
    headsTurned: number;
    headTilts: number;
    lookAways: number;
    multiplePeople: number;
    faceVisibilityIssues: number;
    mobileDetected: number;
    audioIncidents: number;
}

export interface ProctoringManagerProps {
    attemptId: number;
    onViolationUpdate?: (counts: ViolationCounts) => void;
    onError?: (error: string) => void;
}

export type ViolationType = keyof ViolationCounts;

export { };
