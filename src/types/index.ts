export const UserCreationMode = {
  INIT_ROOT_ADMIN: "INIT_ROOT_ADMIN",
  CREATE_SUPER_ADMIN: "CREATE_SUPER_ADMIN",
  CREATE_ADMIN: "CREATE_ADMIN",
  CREATE_USER: "CREATE_USER",
} as const;

export type UserCreationModeType =
  (typeof UserCreationMode)[keyof typeof UserCreationMode];

export const QuestionType = {
  MCQ: "MCQ",
  MAQ: "MAQ",
  FILL_BLANK: "FILL_BLANK",
} as const;

export type QuestionTypeType = (typeof QuestionType)[keyof typeof QuestionType];

export const UserRole = {
  ROOTADMIN: "ROOTADMIN",
  SUPERADMIN: "SUPERADMIN",
  ADMIN: "ADMIN",
  USER: "USER",
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

export interface Test {
  id: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  totalMarks: number;
  published: boolean;
  maxAttempts: number;
  createdBy: number;
  proctored: boolean;
}

export interface CreateTestRequest {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  totalMarks: number;
  published: boolean;
  maxAttempts: number;
  proctored: boolean;
}

export interface UpdateTestRequest {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  totalMarks?: number;
  published?: boolean;
  maxAttempts?: number;
  proctored?: boolean;
}

export interface Question {
  id: number;
  testId: number;
  questionType: QuestionTypeType;
  questionText: string;
  marks: number;
  negativeMarks: number;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctOption?: string;
  correctOptionsCsv?: string;
  correctAnswer?: string;
}

export interface CreateQuestionRequest {
  questionType: QuestionTypeType;
  questionText: string;
  marks: number;
  negativeMarks: number;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctOption?: string;
  correctOptionsCsv?: string;
  correctAnswer?: string;
}

export interface UpdateQuestionRequest {
  questionType?: QuestionTypeType;
  questionText?: string;
  marks?: number;
  negativeMarks?: number;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctOption?: string;
  correctOptionsCsv?: string;
  correctAnswer?: string;
}

export interface Attempt {
  id: number;
  testId: number;
  userId: number;
  attemptNumber: number;
  startedAt: string;
  submittedAt?: string;
  score?: number;
  maxScore: number;
  completed: boolean;
  proctored?: boolean; // Whether this test requires proctoring
  answers?: Answer[]; // Optional answers field if returned
}

export interface Answer {
  id: number;
  attemptId: number;
  questionId: number;
  answerText: string;
  isCorrect: boolean;
  marksObtained: number;
}

export interface SubmitAnswerRequest {
  questionId: number;
  answerText: string;
}

export interface SessionReport {
  id: number;
  attemptId: number;
  headsTurned: number;
  headTilts: number;
  lookAways: number;
  multiplePeople: number;
  faceVisibilityIssues: number;
  mobileDetected: number;
  audioIncidents: number;
  isValidTest?: boolean;
  invalidReason?: string;
}

export interface UpdateSessionReportRequest {
  headsTurned?: number;
  headTilts?: number;
  lookAways?: number;
  multiplePeople?: number;
  faceVisibilityIssues?: number;
  mobileDetected?: number;
  audioIncidents?: number;
}

export interface FinalizeSessionReportRequest {
  isValidTest: boolean;
  invalidReason?: string;
}

export interface Result {
  id: number;
  test: {
    id: number;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    totalMarks: number;
    published: boolean;
    maxAttempts: number;
    createdBy: any; // Using any to handle nested user object structure
  };
  student: {
    id: number;
    email: string;
    name: string;
    type: string;
  };
  attemptNumber: number;
  startedAt: string;
  submittedAt: string | null;
  score: number;
  completed: boolean;
  updatedAt: string;
  isValidTest?: boolean;
}

export interface AttemptInfo {
  id: number;
  attemptNumber: number;
  completed: boolean;
  startedAt: string | null;
  submittedAt: string | null;
  updatedAt: string | null;
}

export interface AttemptStateResponse {
  attempt: AttemptInfo;
  questions: Question[];
  answers: Record<string, string>;
}
