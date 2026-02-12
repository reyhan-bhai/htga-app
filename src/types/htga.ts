// Types for HTGA Application

export type EstablishmentStatus = "Active" | "Removed" | "Temporarily Closed";
export type HalalStatus =
  | "Muslim-friendly"
  | "Halal Certified by JAKIM"
  | "Muslim-Owned";
export type EvaluatorRole = "evaluator1" | "evaluator2";
export type EvaluationStatus =
  | "Completed"
  | "Not Completed"
  | "Continue"
  | "Start";

export interface CompletionStatus {
  allCompleted: boolean;
  evaluator1Completed: boolean;
  evaluator2Completed: boolean;
}

export interface Evaluator {
  evaluatorId: string;
  evaluatorName: string;
  evaluatorRole: EvaluatorRole;
  assignmentId: string;
  status: EvaluationStatus;
  dateAssigned: string;
  reminderCount: number;
  specialties: string[];
  lastUpdated: string;
}

export interface Establishment {
  id: string;
  name: string;
  trimmedName: string;
  address: string;
  status: EstablishmentStatus;
  category: string;
  contact: string;
  rating: number;
  budget: number;
  halalStatus: HalalStatus;
  remarks: string;
  source: string;
  isBakingPastry: boolean;
  matched: boolean;
  dateAssigned: string;
  completionStatus: CompletionStatus;
  createdAt: string;
  updatedAt: string;
  evaluators: Evaluator[];
}

export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  role: "evaluator" | "admin" | "superadmin";
  phone?: string;
  company?: string;
}
