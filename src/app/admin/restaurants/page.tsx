"use client";

import RestaurantModal from "@/components/admin/RestaurantModal";
import { Establishment } from "@/types/restaurant";
import { useState } from "react";

export default function RestaurantsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Establishment | null>(null);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");

  const handleAddRestaurant = () => {
    setSelectedRestaurant(null);
    setModalMode("add");
    setIsModalOpen(true);
  };

  const handleEditRestaurant = (restaurant: Establishment) => {
    setSelectedRestaurant(restaurant);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleViewRestaurant = (restaurant: Establishment) => {
    setSelectedRestaurant(restaurant);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleSaveRestaurant = async (restaurant: Partial<Establishment>) => {
    try {
      // TODO: Implement API call to save restaurant
      console.log("Saving restaurant:", restaurant);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving restaurant:", error);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Restaurant Management</h2>
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleAddRestaurant}
          className="bg-gradient-to-r from-[#FF6B00] to-[#FFA200] text-white px-4 py-2 rounded-md hover:shadow-lg transition"
        >
          Add Restaurant
        </button>
        <button
          onClick={() =>
            handleViewRestaurant({
              id: "sample-123",
              name: "Sample Restaurant",
              category: "Italy",
              address:
                "JL. REI NOELTOLI LUSING BERLINA ST BAK NO. 44, EC CIRRLI LEO, PALARAN, KOTA BANDUNG, JAWA BARAT, INDONESIA",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
          }
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:shadow-lg transition"
        >
          View Detail Restaurant
        </button>
      </div>

      <RestaurantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRestaurant}
        restaurant={selectedRestaurant}
        mode={modalMode}
      />
    </div>
  );
}
