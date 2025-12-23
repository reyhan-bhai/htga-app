"use client";

import AdminHeader from "@/components/admin/AdminHeader";
import AdminModal from "@/components/admin/AdminModal";
import AdminTable from "@/components/admin/AdminTable";
import AdminViewControl from "@/components/admin/AdminViewControl";
import { useState, useMemo, useEffect } from "react";
import Swal from "sweetalert2";

import { useRestaurants } from "@/context/RestaurantContext";
import { Pagination } from "@nextui-org/react";
import React from "react";

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
  const [page, setPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [ratingRange, setRatingRange] = useState({ min: 0, max: 5 });
  const [budgetRange, setBudgetRange] = useState({ min: 0, max: 10000 });
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

  const clearFilters = () => {
    setSelectedCategories([]);
    setSearchQuery("");
    setRatingRange({ min: 0, max: 5 });
    setBudgetRange({ min: 0, max: 10000 });
  };

  const activeFiltersCount =
    selectedCategories.length +
    (searchQuery.trim().length > 0 ? 1 : 0) +
    (ratingRange.min > 0 || ratingRange.max < 5 ? 1 : 0) +
    (budgetRange.min > 0 || budgetRange.max < 10000 ? 1 : 0);

  // Extract unique categories from restaurants data
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    restaurants.forEach((restaurant) => {
      if (restaurant.category) {
        categories.add(restaurant.category);
      }
    });
    return Array.from(categories).sort();
  }, [restaurants]);

  // Create filtered restaurants based on all filters and search
  const filteredRestaurants = useMemo(() => {
    let results = restaurants;

    // Filter by search query
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      results = results.filter((restaurant) => {
        const searchFields = [
          restaurant.name || "",
          restaurant.address || "",
          restaurant.category || "",
          restaurant.remarks || "",
        ];
        return searchFields.some((field) =>
          field.toLowerCase().includes(query)
        );
      });
    }

    // Filter by categories
    if (selectedCategories.length > 0) {
      results = results.filter((restaurant) =>
        selectedCategories.includes(restaurant.category)
      );
    }

    // Filter by rating range
    results = results.filter((restaurant) => {
      const rating = parseFloat(restaurant.rating) || 0;
      return rating >= ratingRange.min && rating <= ratingRange.max;
    });

    // Filter by budget range
    results = results.filter((restaurant) => {
      const budget = parseFloat(restaurant.budget) || 0;
      return budget >= budgetRange.min && budget <= budgetRange.max;
    });

    return results;
  }, [restaurants, searchQuery, selectedCategories, ratingRange, budgetRange]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredRestaurants.length / rowsPerPage);

  // Get paginated restaurants
  const paginatedRestaurants = filteredRestaurants.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedCategories, ratingRange, budgetRange]);

  // Reset page to 1 when rows per page changes
  useEffect(() => {
    setPage(1);
  }, [rowsPerPage]);

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="text-black flex flex-col gap-6">
      <AdminHeader type="restaurant" />

      <AdminViewControl
        type="restaurant"
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        categories={availableCategories}
        toggleCategory={toggleCategory}
        ratingRange={ratingRange}
        setRatingRange={setRatingRange}
        budgetRange={budgetRange}
        setBudgetRange={setBudgetRange}
        activeFiltersCount={activeFiltersCount}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={setRowsPerPage}
        clearFilters={clearFilters}
        handleAddRestaurant={handleAddRestaurant}
      />

      <AdminTable
        type="restaurant"
        isLoading={isLoading}
        columns={columns}
        data={paginatedRestaurants}
        handleEditItem={handleEditRestaurant}
        handleViewItem={handleViewRestaurant}
        handleDeleteItem={handleDeleteRestaurant}
      />
      <div className="flex justify-center items-center mt-4">
        <div className="block md:hidden">
          <Pagination
            isCompact
            showControls
            total={totalPages || 1}
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
            total={totalPages || 1}
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
  )
}
