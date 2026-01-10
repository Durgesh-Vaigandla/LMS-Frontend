export enum UserCreationMode {
  INIT_ROOT_ADMIN = "INIT_ROOT_ADMIN",
  CREATE_SUPER_ADMIN = "CREATE_SUPER_ADMIN",
  CREATE_ADMIN = "CREATE_ADMIN",
  CREATE_USER = "CREATE_USER",
}

export interface Test {
  id: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  totalMarks: number;
  published: boolean;
  maxAttempts: number;
  createdBy?: number;
}

export type QuestionType = "MCQ" | "MAQ" | "FILL_BLANK";

export interface Question {
  id: number;
  testId: number;
  questionType: QuestionType;
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

export interface Attempt {
  id: number;
  userId: number;
  testId: number;
  startTime: string;
  endTime?: string;
  score?: number;
}

export interface AnswerPayload {
  questionId: number;
  answerText: string;
}

