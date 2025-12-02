export interface Evaluator {
  id: string;
  name: string;
  specialties: string[]; // ["Bakery", "FastFood", "Italy"]
  maxAssignments?: number; // Optional: limit jumlah assignment per evaluator
  createdAt: string;
  updatedAt: string;
}

export interface Establishment {
  id: string;
  name: string;
  category: string; // "Bakery", "FastFood", "Italy"
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  establishmentId: string;
  evaluator1Id: string;
  evaluator2Id: string;
  status: "pending" | "in-progress" | "completed";
  assignedAt: string;
  completedAt?: string;
  notes?: string;
}

export interface AssignmentWithDetails extends Assignment {
  establishment: Establishment;
  evaluator1: Evaluator;
  evaluator2: Evaluator;
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
