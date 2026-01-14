"use client";

import { db } from "@/lib/firebase";
import { onValue, ref } from "firebase/database";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

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

const EvaluatorsContext = createContext<EvaluatorsContextType | undefined>(
  undefined
);

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

export const EvaluatorsProvider: React.FC<EvaluatorsProviderProps> = ({
  children,
}) => {
  const [evaluators, setEvaluators] = useState<Evaluator[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const evaluatorsRef = ref(db, "evaluators");
    const unsubscribe = onValue(evaluatorsRef, (snapshot) => {
      const data = snapshot.val();
      setEvaluators(
        data
          ? Object.entries(data).map(([id, val]: [string, any]) => ({
              id,
              ...val,
            }))
          : []
      );
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const refetchEvaluators = () => {
    // No-op with listeners
    console.log("refetchEvaluators called, but using listeners now.");
  };

  return (
    <EvaluatorsContext.Provider
      value={{ evaluators, isLoading, refetchEvaluators }}
    >
      {children}
    </EvaluatorsContext.Provider>
  );
};
