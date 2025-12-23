"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import Swal from "sweetalert2";

interface Evaluator {
  id: string;
  name: string;
  email: string;
  specialties: string[];
  phone: string;
  position: string;
  company: string;
  // Add other fields as needed
}

interface EvaluatorsContextType {
  evaluators: Evaluator[];
  isLoading: boolean;
  refetchEvaluators: () => void;
}

const EvaluatorsContext = createContext<EvaluatorsContextType | undefined>(undefined);

export const useEvaluators = () => {
  const context = useContext(EvaluatorsContext);
  if (!context) {
    throw new Error("useEvaluators must be used within an EvaluatorsProvider");
  }
  return context;
};

interface EvaluatorsProviderProps {
  children: ReactNode;
}

export const EvaluatorsProvider: React.FC<EvaluatorsProviderProps> = ({ children }) => {
  const [evaluators, setEvaluators] = useState<Evaluator[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvaluators = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/evaluators");
      if (!response.ok) {
        throw new Error("Failed to fetch evaluators");
      }
      const data = await response.json();
      setEvaluators(data.evaluators || []);
    } catch (error) {
      console.error("Error fetching evaluators:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load evaluators",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluators(); // Fetch once on mount (when admin logs in)
  }, []);

  const refetchEvaluators = () => {
    fetchEvaluators(); // Manual refetch if needed
  };

  return (
    <EvaluatorsContext.Provider value={{ evaluators, isLoading, refetchEvaluators }}>
      {children}
    </EvaluatorsContext.Provider>
  );
};