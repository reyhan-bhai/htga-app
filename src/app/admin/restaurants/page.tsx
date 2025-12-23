"use client";

import AdminHeader from "@/components/admin/AdminHeader";
import AdminModal from "@/components/admin/AdminModal";
import AdminTable from "@/components/admin/AdminTable";
import AdminViewControl from "@/components/admin/AdminViewControl";
import { useAssignedContext } from "@/context/AssignedContext";
import { useRestaurants } from "@/context/RestaurantContext";
import { Pagination } from "@nextui-org/react";
import React, { useState } from "react";
import Swal from "sweetalert2";

const columns = [
  // { name: "ID", uid: "id" },
  { name: "Restaurant Name", uid: "name" },
  { name: "Category", uid: "category" },
  { name: "Address", uid: "address" },
  { name: "Contact", uid: "contactInfo" },
  { name: "Rating", uid: "rating" },
  { name: "Budget (MYR)", uid: "budget" },
  { name: "Halal Status", uid: "halalStatus" },
  { name: "Remarks", uid: "remarks" },
  { name: "Actions", uid: "actions" },
];

export default function RestaurantsPage() {
  const { restaurants, isLoading, refetchRestaurants } = useRestaurants();
  const { fetchData: refetchAssignments } = useAssignedContext();
  const [page, setPage] = React.useState(1);
  const [selectedCities, setSelectedCities] = React.useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = React.useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [restaurantToDelete, setRestaurantToDelete] = useState<any>(null);

  const handleAddRestaurant = () => {
    setSelectedRestaurant(null);
    setModalMode("add");
    setIsModalOpen(true);
  };

  const handleViewRestaurant = (restaurant: any) => {
    setSelectedRestaurant(restaurant);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleSaveRestaurant = async (restaurant: any) => {
    try {
      if (modalMode === "add") {
        const response = await fetch("/api/establishments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(restaurant),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create restaurant");
        }

        await Swal.fire({
          icon: "success",
          title: "Restaurant Created!",
          text: "Restaurant has been added successfully.",
          confirmButtonColor: "#A67C37",
        });
      } else if (modalMode === "edit") {
        const response = await fetch("/api/establishments", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(restaurant),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update restaurant");
        }

        await Swal.fire({
          icon: "success",
          title: "Success",
          text: "Restaurant updated successfully",
          confirmButtonColor: "#A67C37",
        });
      }

      setIsModalOpen(false);
      refetchRestaurants();
      refetchAssignments();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: error instanceof Error ? error.message : "Unknown error",
        confirmButtonColor: "#A67C37",
      });
    }
  };

  const handleEditRestaurant = (restaurant: any) => {
    setSelectedRestaurant(restaurant);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleDeleteRestaurant = (restaurant: any) => {
    setRestaurantToDelete(restaurant);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      if (!restaurantToDelete?.id) {
        throw new Error("Restaurant ID is missing");
      }

      const response = await fetch(
        `/api/establishments?id=${restaurantToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete restaurant");
      }

      await Swal.fire({
        icon: "success",
        title: "Success",
        text: "Restaurant deleted successfully",
        confirmButtonColor: "#A67C37",
      });

      setIsDeleteModalOpen(false);
      setRestaurantToDelete(null);
      refetchRestaurants();
      refetchAssignments();
    } catch (error) {
      console.error("Error deleting restaurant:", error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: error instanceof Error ? error.message : "Unknown error",
        confirmButtonColor: "#A67C37",
      });
    }
  };

  const cities = ["Johor", "Kuala Lumpur", "Penang", "Selangor"];
  const statuses = ["Assigned", "Unassigned"];

  const toggleCity = (city: string) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  };

  const toggleStatus = (status: string) => {
    setSelectedStatus((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const clearFilters = () => {
    setSelectedCities([]);
    setSelectedStatus([]);
  };

  const activeFiltersCount = selectedCities.length + selectedStatus.length;

  return (
    <div className="text-black flex flex-col gap-6">
      <AdminHeader type="restaurant" />

      <AdminViewControl
        type="restaurant"
        selectedCities={selectedCities}
        setSelectedCities={setSelectedCities}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        activeFiltersCount={activeFiltersCount}
        cities={cities}
        statuses={statuses}
        toggleCity={toggleCity}
        toggleStatus={toggleStatus}
        clearFilters={clearFilters}
        handleAddRestaurant={handleAddRestaurant}
      />

      <AdminTable
        type="restaurant"
        isLoading={isLoading}
        columns={columns}
        data={restaurants}
        handleEditItem={handleEditRestaurant}
        handleViewItem={handleViewRestaurant}
        handleDeleteItem={handleDeleteRestaurant}
      />

      <div className="flex justify-center items-center mt-4">
        <div className="block md:hidden">
          <Pagination
            isCompact
            showControls
            total={10}
            page={page}
            onChange={setPage}
            siblings={0}
            classNames={{
              cursor: "bg-[#A67C37] text-white font-bold",
            }}
          />
        </div>
        <div className="hidden md:block">
          <Pagination
            showControls
            total={10}
            page={page}
            onChange={setPage}
            classNames={{
              cursor: "bg-[#A67C37] text-white font-bold",
            }}
          />
        </div>
      </div>

      <AdminModal
        type="restaurant"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRestaurant}
        entity={selectedRestaurant}
        mode={modalMode}
      />

      {/* Delete Confirmation Modal */}
      <AdminModal
        type="delete"
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        entityName={restaurantToDelete?.name || ""}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
