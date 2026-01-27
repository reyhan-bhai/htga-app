export interface Evaluator {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  city?: string;
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
  currency?: string;
  halalStatus?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  establishmentId: string;
  evaluator1Id: string;
  evaluator1Status: "pending" | "completed" | "reassigned" | "reported";
  evaluator1UniqueID?: string;
  evaluator1AssignedAt?: string;
  evaluator1Receipt?: string; // URL to receipt image
  evaluator1AmountSpent?: number; // Amount spent in RM
  evaluator1Currency?: string;
  evaluator2Id: string;
  evaluator2Status: "pending" | "completed" | "reassigned" | "reported";
  evaluator2UniqueID?: string;
  evaluator2AssignedAt?: string;
  evaluator2Receipt?: string; // URL to receipt image
  evaluator2AmountSpent?: number; // Amount spent in RM
  evaluator2Currency?: string;
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
