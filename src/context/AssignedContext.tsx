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
  undefined
);

export const useAssignedContext = () => {
  const context = useContext(AssignedContext);
  if (!context) {
    throw new Error(
      "useAssignedContext must be used within an AssignedProvider"
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
      let establishment: any = null;

      // FIXED SLOT STRUCTURE: Use JEVA_FIRST and JEVA_SECOND
      if (assignment.evaluators) {
        const jevaFirst = assignment.evaluators.JEVA_FIRST;
        const jevaSecond = assignment.evaluators.JEVA_SECOND;

        // Process JEVA_FIRST (Evaluator 1)
        if (jevaFirst) {
          const evaluator = evaluators.find(
            (e) => e.id === jevaFirst.evaluatorId
          );

          // Get establishment from JEVA_FIRST's establishmentId
          if (!establishment && jevaFirst.establishmentId) {
            establishment = establishments.find(
              (e) => e.id === jevaFirst.establishmentId
            );
          }

          if (evaluator) {
            evaluator1Details = {
              ...evaluator,
              ...jevaFirst,
              slot: "JEVA_FIRST",
            };
          } else {
            evaluator1Details = {
              id: jevaFirst.evaluatorId,
              name: "Unknown Evaluator",
              ...jevaFirst,
              slot: "JEVA_FIRST",
            };
          }
        }

        // Process JEVA_SECOND (Evaluator 2)
        if (jevaSecond) {
          const evaluator = evaluators.find(
            (e) => e.id === jevaSecond.evaluatorId
          );

          // Get establishment from JEVA_SECOND if not already found
          if (!establishment && jevaSecond.establishmentId) {
            establishment = establishments.find(
              (e) => e.id === jevaSecond.establishmentId
            );
          }

          if (evaluator) {
            evaluator2Details = {
              ...evaluator,
              ...jevaSecond,
              slot: "JEVA_SECOND",
            };
          } else {
            evaluator2Details = {
              id: jevaSecond.evaluatorId,
              name: "Unknown Evaluator",
              ...jevaSecond,
              slot: "JEVA_SECOND",
            };
          }
        }
      }

      // Build evaluatorsDetails array for compatibility
      const evaluatorsDetails: any[] = [];
      if (evaluator1Details) evaluatorsDetails.push(evaluator1Details);
      if (evaluator2Details) evaluatorsDetails.push(evaluator2Details);

      return {
        ...assignment,
        establishment: establishment || { id: "unknown", name: "Unknown" },
        evaluator1: evaluator1Details,
        evaluator2: evaluator2Details,
        evaluatorsDetails,
        // For backward compatibility in tables
        establishmentId:
          evaluator1Details?.establishmentId ||
          evaluator2Details?.establishmentId ||
          assignment.establishmentId,
        assignedAt:
          evaluator1Details?.assignedAt ||
          evaluator2Details?.assignedAt ||
          assignment.assignedAt,
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
        ? Object.entries(data).map(([id, val]: [string, any]) => ({
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
