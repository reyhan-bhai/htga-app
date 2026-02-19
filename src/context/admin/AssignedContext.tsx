"use client";

import { db } from "@/lib/firebase";
import { onValue, ref } from "firebase/database";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface AssignedContextType {
  assignments: any[];
  evaluators: any[];
  establishments: any[];
  isLoading: boolean;
  setAssignments: (assignments: any[]) => void;
  setEvaluators: (evaluators: any[]) => void;
  setEstablishments: (establishments: any[]) => void;
  setIsLoading: (loading: boolean) => void;
  fetchData: () => Promise<void>;
}

const AssignedContext = createContext<AssignedContextType | undefined>(
  undefined,
);

export const useAssignedContext = () => {
  const context = useContext(AssignedContext);
  if (!context) {
    throw new Error(
      "useAssignedContext must be used within an AssignedProvider",
    );
  }
  return context;
};

export const AssignedProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [rawAssignments, setRawAssignments] = useState<any[]>([]);
  const [evaluators, setEvaluators] = useState<any[]>([]);
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to join data - FIXED SLOT STRUCTURE
  const joinData = useCallback(() => {
    if (rawAssignments.length === 0) {
      setAssignments([]);
      return;
    }

    const detailedAssignments = rawAssignments.map((assignment) => {
      // Handle evaluators
      let evaluator1Details: any = null;
      let evaluator2Details: any = null;

      // Find establishment
      const establishment = establishments.find(
        (e) => e.id === assignment.establishmentId,
      ) || { id: assignment.establishmentId, name: "Unknown Establishment" };

      // Process Evaluator 1
      if (assignment.evaluator1Id) {
        const evaluator = evaluators.find(
          (e) => e.id === assignment.evaluator1Id,
        );

        evaluator1Details = {
          ...(evaluator || { name: "Unknown Evaluator" }),
          id: assignment.evaluator1Id,
          status: assignment.evaluator1Status,
          uniqueId: assignment.evaluator1UniqueID,
          slot: "Evaluator 1",
        };
      }

      // Process Evaluator 2
      if (assignment.evaluator2Id) {
        const evaluator = evaluators.find(
          (e) => e.id === assignment.evaluator2Id,
        );

        evaluator2Details = {
          ...(evaluator || { name: "Unknown Evaluator" }),
          id: assignment.evaluator2Id,
          status: assignment.evaluator2Status,
          uniqueId: assignment.evaluator2UniqueID,
          slot: "Evaluator 2",
        };
      }

      // Build evaluatorsDetails array for compatibility
      const evaluatorsDetails: any[] = [];
      if (evaluator1Details) evaluatorsDetails.push(evaluator1Details);
      if (evaluator2Details) evaluatorsDetails.push(evaluator2Details);

      return {
        ...assignment,
        establishment,
        evaluator1: evaluator1Details,
        evaluator2: evaluator2Details,
        evaluatorsDetails,
        // For backward compatibility in tables
        establishmentId: assignment.establishmentId,
        assignedAt: assignment.assignedAt,
      };
    });

    setAssignments(detailedAssignments);
  }, [rawAssignments, evaluators, establishments]);

  // Update detailed assignments when raw data changes
  useEffect(() => {
    joinData();
  }, [joinData]);

  const fetchData = useCallback(async () => {
    // No-op or manual refresh if needed, but listeners handle it.
    // We can keep it for compatibility if components call it.
    console.log("fetchData called, but using listeners now.");
  }, []);

  useEffect(() => {
    setIsLoading(true);

    const assignmentsRef = ref(db, "assignments");
    const evaluatorsRef = ref(db, "evaluators");
    const establishmentsRef = ref(db, "establishments");

    const unsubAssignments = onValue(assignmentsRef, (snap) => {
      const data = snap.val();
      const list = data
        ? Object.entries(data).map(([id, val]: [string, any]) => ({
            id,
            ...val,
          }))
        : [];
      setRawAssignments(list);
    });

    const unsubEvaluators = onValue(evaluatorsRef, (snap) => {
      const data = snap.val();
      const list = data
        ? Object.entries(data)
            .filter(([, val]: [string, any]) => {
              // Filter out corrupted/incomplete evaluator nodes
              return val && typeof val === "object" && val.email;
            })
            .map(([id, val]: [string, any]) => ({
              id,
              ...val,
            }))
        : [];
      setEvaluators(list);
    });

    const unsubEstablishments = onValue(establishmentsRef, (snap) => {
      const data = snap.val();
      const list = data
        ? Object.entries(data).map(([id, val]: [string, any]) => ({
            id,
            ...val,
          }))
        : [];
      setEstablishments(list);
      setIsLoading(false); // Assume initial load done when establishments load (or all 3)
    });

    return () => {
      unsubAssignments();
      unsubEvaluators();
      unsubEstablishments();
    };
  }, []);

  return (
    <AssignedContext.Provider
      value={{
        assignments,
        evaluators,
        establishments,
        isLoading,
        setAssignments,
        setEvaluators,
        setEstablishments,
        setIsLoading,
        fetchData,
      }}
    >
      {children}
    </AssignedContext.Provider>
  );
};
