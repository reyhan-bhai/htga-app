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

interface Restaurant {
  id: string;
  name: string;
  category: string;
  address?: string;
  contactInfo?: string;
  rating: string;
  budget: string;
  halalStatus?: string;
  remarks?: string;
}

interface RestaurantsContextType {
  restaurants: Restaurant[];
  isLoading: boolean;
  refetchRestaurants: () => void;
}

const RestaurantsContext = createContext<RestaurantsContextType | undefined>(
  undefined
);

export const useRestaurants = () => {
  const context = useContext(RestaurantsContext);
  if (!context) {
    throw new Error("useRestaurants must be used within a RestaurantsProvider");
  }
  return context;
};

interface RestaurantsProviderProps {
  children: ReactNode;
}

export const RestaurantsProvider: React.FC<RestaurantsProviderProps> = ({
  children,
}) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const establishmentsRef = ref(db, "establishments");
    const unsubscribe = onValue(establishmentsRef, (snapshot) => {
      const data = snapshot.val();
      setRestaurants(
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

  const refetchRestaurants = () => {
    // No-op with listeners
    console.log("refetchRestaurants called, but using listeners now.");
  };

  return (
    <RestaurantsContext.Provider
      value={{ restaurants, isLoading, refetchRestaurants }}
    >
      {children}
    </RestaurantsContext.Provider>
  );
};
