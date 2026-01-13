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

export interface Assignment {
  id: string;
  establishmentId: string;
  evaluator1Id: string;
  evaluator1Status: "pending" | "completed";
  evaluator1UniqueID?: string;
  evaluator1AssignedAt?: string;
  evaluator2Id: string;
  evaluator2Status: "pending" | "completed";
  evaluator2UniqueID?: string;
  evaluator2AssignedAt?: string;
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
