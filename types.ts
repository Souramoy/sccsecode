// User Types
export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
}

export enum Batch {
  X = 'X',
  Y = 'Y',
}

export interface User {
  email: string;
  role: UserRole;
  name?: string; // Teacher ID/Name
  batch?: Batch; // Student Batch
}

// Assignment Types
export interface Assignment {
  id: string;
  subjectCode: string;
  batch: Batch;
  assignmentNumber: number;
  questions: Question[];
  createdBy: string; // Teacher Email
  createdAt?: string;
}

export interface Question {
  id: string;
  title: string;
  description: string;
  expectedTimeComplexity: string;
  expectedSpaceComplexity: string;
}

// Submission Types
export interface Submission {
  id: string;
  studentEmail: string;
  subjectCode: string;
  assignmentNumber: number;
  questionId: string;
  code: string;
  language: string;
  input: string;  // Added
  output: string; // Added
  timeComplexity: string;
  spaceComplexity: string;
  score: number | null; // Changed to nullable for "Unchecked" status
  timestamp: string;
}

// API Responses
export interface AuthResponse {
  user: User;
  token?: string; // Simplified for this demo
}