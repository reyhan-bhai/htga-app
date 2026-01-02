export interface Evaluator {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  position?: string;
  company?: string;
  specialties: string[]; // ["Bakery", "FastFood", "Italy"]
  maxAssignments?: number; // Optional: limit jumlah assignment per evaluator
  password: string; // For login authentication
  createdAt: string;
  updatedAt: string;
}

export interface Establishment {
  id: string;
  name: string;
  category: string; // "Bakery", "FastFood", "Italy"
  address?: string;
  contactInfo?: string;
  rating?: number; // Average rating from evaluators
  budget?: string;
  halalStatus?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentEvaluatorData {
  uniqueId: string;
  establishmentId: string;
  assignedAt: string;
  evaluatorId: string;
  evaluatorStatus: "pending" | "completed";
  status: "pending" | "completed";
  completedAt?: string;
}

// Fixed slot keys for evaluator positions
export type EvaluatorSlot = "JEVA_FIRST" | "JEVA_SECOND";

// Evaluators map with fixed slot keys
export type EvaluatorsMap = {
  JEVA_FIRST?: AssignmentEvaluatorData;
  JEVA_SECOND?: AssignmentEvaluatorData;
};

export interface Assignment {
  id: string;
  evaluators?: EvaluatorsMap;
  completedAt?: string;
  notes?: string;
  // Legacy fields for backward compatibility during migration (optional)
  establishmentId?: string;
  assignedAt?: string;
  evaluator1Id?: string;
  evaluator1Status?: "pending" | "completed";
  evaluator2Id?: string;
  evaluator2Status?: "pending" | "completed";
}

export interface AssignmentWithDetails extends Assignment {
  establishment?: Establishment;
  evaluatorsDetails: (Evaluator & AssignmentEvaluatorData)[];
}

export interface AssignmentRequest {
  establishmentId: string;
  forceReassign?: boolean; // Optional: force reassign if already assigned
}

export interface AssignmentResponse {
  success: boolean;
  assignment?: Assignment;
  message: string;
  errors?: string[];
}
