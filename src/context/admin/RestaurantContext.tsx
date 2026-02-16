"use client";

import { db } from "@/lib/firebase";
import { get, onValue, ref } from "firebase/database";
import React, {
  createContext,
  ReactNode,
  useCallback,
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

  const parseRestaurants = (data: any): Restaurant[] => {
    if (data && typeof data === "object") {
      return Object.entries(data)
        .filter(([id, val]) => {
          return (
            id !== "dropdown" &&
            val &&
            typeof val === "object" &&
            (val as any).name
          );
        })
        .map(([id, val]) => {
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
    }
    return [];
  };

  useEffect(() => {
    setIsLoading(true);
    const establishmentsRef = ref(db, "establishments");
    console.log(
      "🔵 [RestaurantContext] Setting up onValue listener on:",
      establishmentsRef.toString(),
    );
    const unsubscribe = onValue(establishmentsRef, (snapshot) => {
      const data = snapshot.val();
      const keys = data ? Object.keys(data) : [];
      console.log(
        "🔵 [RestaurantContext] onValue fired. Total raw keys:",
        keys.length,
      );
      console.log("🔵 [RestaurantContext] Raw keys:", keys);
      const parsed = parseRestaurants(data);
      console.log(
        "🔵 [RestaurantContext] Parsed restaurants count:",
        parsed.length,
      );
      console.log(
        "🔵 [RestaurantContext] Parsed restaurant names:",
        parsed.map((r) => r.name),
      );
      setRestaurants(parsed);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const refetchRestaurants = useCallback(async () => {
    try {
      console.log(
        "🟡 [RestaurantContext] refetchRestaurants called, doing get()...",
      );
      const establishmentsRef = ref(db, "establishments");
      const snapshot = await get(establishmentsRef);
      const data = snapshot.val();
      const keys = data ? Object.keys(data) : [];
      console.log(
        "🟡 [RestaurantContext] get() returned. Total raw keys:",
        keys.length,
      );
      console.log("🟡 [RestaurantContext] Raw keys:", keys);
      const parsed = parseRestaurants(data);
      console.log(
        "🟡 [RestaurantContext] Parsed restaurants count:",
        parsed.length,
      );
      console.log(
        "🟡 [RestaurantContext] Parsed restaurant names:",
        parsed.map((r) => r.name),
      );
      setRestaurants(parsed);
    } catch (error) {
      console.error(
        "🔴 [RestaurantContext] Error refetching restaurants:",
        error,
      );
    }
  }, []);

  return (
    <RestaurantsContext.Provider
      value={{ restaurants, isLoading, refetchRestaurants }}
    >
      {children}
    </RestaurantsContext.Provider>
  );
};
