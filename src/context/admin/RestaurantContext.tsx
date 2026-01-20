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
  undefined,
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

      if (data && typeof data === "object") {
        const restaurantsList = Object.entries(data)
          .filter(([id, val]) => {
            // Filter out dropdown node and ensure valid restaurant data
            return (
              id !== "dropdown" &&
              val &&
              typeof val === "object" &&
              (val as any).name
            );
          })
          .map(([id, val]) => {
            // Ensure val is an object and extract its properties
            const restaurantData = val as any;
            return {
              id,
              name: restaurantData.name || "",
              category: restaurantData.category || "",
              address: restaurantData.address,
              contactInfo: restaurantData.contactInfo,
              rating: restaurantData.rating || "0",
              budget: restaurantData.budget || "0",
              currency: restaurantData.currency,
              halalStatus: restaurantData.halalStatus,
              remarks: restaurantData.remarks,
            };
          });
        setRestaurants(restaurantsList);
      } else {
        setRestaurants([]);
      }

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
