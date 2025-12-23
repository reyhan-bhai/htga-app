"use client";

import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import Swal from "sweetalert2";

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

  const fetchRestaurants = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/establishments");
      if (!response.ok) {
        throw new Error("Failed to fetch restaurants");
      }
      const data = await response.json();
      setRestaurants(data.establishments || []);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load restaurants",
        confirmButtonColor: "#A67C37",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants(); // Fetch once on mount (when admin logs in)
  }, []);

  const refetchRestaurants = () => {
    fetchRestaurants(); // Manual refetch if needed
  };

  return (
    <RestaurantsContext.Provider
      value={{ restaurants, isLoading, refetchRestaurants }}
    >
      {children}
    </RestaurantsContext.Provider>
  );
};
