"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import Swal from "sweetalert2";

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
  const [evaluators, setEvaluators] = useState<any[]>([]);
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [assignmentsRes, evaluatorsRes, establishmentsRes] =
        await Promise.all([
          fetch("/api/assignments?includeDetails=true"),
          fetch("/api/evaluators"),
          fetch("/api/establishments"),
        ]);

      const assignmentsData = await assignmentsRes.json();
      const evaluatorsData = await evaluatorsRes.json();
      const establishmentsData = await establishmentsRes.json();

      setAssignments(assignmentsData.assignments || []);
      setEvaluators(evaluatorsData.evaluators || []);
      setEstablishments(establishmentsData.establishments || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      await Swal.fire({
        icon: "error",
        title: "Failed to Load Data",
        text: "Unable to fetch assignments data. Please refresh the page.",
      });
    } finally {
      setIsLoading(false);
    }
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
