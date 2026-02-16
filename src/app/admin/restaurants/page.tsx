"use client";

import AdminHeader from "@/components/admin/AdminHeader";
import AdminModal from "@/components/admin/AdminModal";
import AdminTable from "@/components/admin/AdminTable";
import AdminViewControl from "@/components/admin/AdminViewControl";

import { useAssignedContext } from "@/context/admin/AssignedContext";
import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import { useRestaurants } from "@/context/admin/RestaurantContext";
import { Pagination } from "@nextui-org/react";

const restaurantColumns = [
  // { name: "ID", uid: "id" },
  { name: "Restaurant Name", uid: "name" },
  { name: "Category", uid: "category" },
  { name: "Address", uid: "address" },
  { name: "Contact", uid: "contactInfo" },
  { name: "Rating", uid: "rating" },
  { name: "Budget", uid: "budget" },
  { name: "Halal Status", uid: "halalStatus" },
  { name: "Remarks", uid: "remarks" },
  { name: "Actions", uid: "actions" },
];

export default function RestaurantsPage() {
  const { restaurants, isLoading, refetchRestaurants } = useRestaurants();
  const {
    assignments,
    evaluators,
    establishments,
    fetchData: refetchAssignments,
  } = useAssignedContext();
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
  const [isSaving, setIsSaving] = useState(false);

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
    setIsSaving(true);
    try {
      if (modalMode === "add") {
        const response = await fetch("/api/admin/establishments", {
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
        const response = await fetch("/api/admin/establishments", {
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
      await refetchRestaurants();
      refetchAssignments();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: error instanceof Error ? error.message : "Unknown error",
        confirmButtonColor: "#A67C37",
      });
    } finally {
      setIsSaving(false);
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
        `/api/admin/establishments?id=${restaurantToDelete.id}`,
        {
          method: "DELETE",
        },
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
      await refetchRestaurants();
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

  // Compute the actual max rating and budget from the data
  const dataMaxRating = useMemo(() => {
    if (restaurants.length === 0) return 5;
    return Math.max(5, ...restaurants.map((r) => parseFloat(r.rating) || 0));
  }, [restaurants]);

  const dataMaxBudget = useMemo(() => {
    if (restaurants.length === 0) return 10000;
    return Math.max(
      10000,
      ...restaurants.map((r) => parseFloat(r.budget) || 0),
    );
  }, [restaurants]);

  const clearFilters = () => {
    setSelectedCategories([]);
    setSearchQuery("");
    setRatingRange({ min: 0, max: dataMaxRating });
    setBudgetRange({ min: 0, max: dataMaxBudget });
  };

  const activeFiltersCount =
    selectedCategories.length +
    (searchQuery.trim().length > 0 ? 1 : 0) +
    (ratingRange.min > 0 || ratingRange.max < dataMaxRating ? 1 : 0) +
    (budgetRange.min > 0 || budgetRange.max < dataMaxBudget ? 1 : 0);

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
          field.toLowerCase().includes(query),
        );
      });
    }

    // Filter by categories
    if (selectedCategories.length > 0) {
      results = results.filter((restaurant) =>
        selectedCategories.includes(restaurant.category),
      );
    }

    // Filter by rating range — only apply if user has customized the range
    const isRatingFilterActive =
      ratingRange.min > 0 || ratingRange.max < dataMaxRating;
    if (isRatingFilterActive) {
      results = results.filter((restaurant) => {
        const rating = parseFloat(restaurant.rating) || 0;
        return rating >= ratingRange.min && rating <= ratingRange.max;
      });
    }

    // Filter by budget range — only apply if user has customized the range
    const isBudgetFilterActive =
      budgetRange.min > 0 || budgetRange.max < dataMaxBudget;
    if (isBudgetFilterActive) {
      results = results.filter((restaurant) => {
        const budget = parseFloat(restaurant.budget) || 0;
        return budget >= budgetRange.min && budget <= budgetRange.max;
      });
    }

    return results;
  }, [
    restaurants,
    searchQuery,
    selectedCategories,
    ratingRange,
    budgetRange,
    dataMaxRating,
    dataMaxBudget,
  ]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredRestaurants.length / rowsPerPage);

  // Get paginated restaurants
  const paginatedRestaurants = filteredRestaurants.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  // Sync filter max values when data-derived max increases
  useEffect(() => {
    setRatingRange((prev) => {
      if (prev.max < dataMaxRating) return { ...prev, max: dataMaxRating };
      return prev;
    });
  }, [dataMaxRating]);

  useEffect(() => {
    setBudgetRange((prev) => {
      if (prev.max < dataMaxBudget) return { ...prev, max: dataMaxBudget };
      return prev;
    });
  }, [dataMaxBudget]);

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
        : [...prev, category],
    );
  };

  const renderRestaurantCell = (
    item: any,
    columnKey: React.Key,
  ): React.ReactNode => {
    const cellValue = item[columnKey as keyof typeof item];

    switch (columnKey) {
      case "name":
        return cellValue || "—";

      case "category":
        return cellValue || "—";

      case "address":
        return cellValue || "—";

      case "contactInfo": {
        const contactValue = cellValue ? String(cellValue).trim() : "";
        return contactValue.length === 0 ? (
          <span className="text-gray-400 italic">No Contact</span>
        ) : (
          contactValue
        );
      }

      case "rating": {
        const ratingValue = cellValue ? String(cellValue).trim() : "";
        return ratingValue.length === 0 ? (
          <span className="text-gray-400 italic">No Rating</span>
        ) : (
          ratingValue
        );
      }

      case "budget": {
        const budgetValue = cellValue ? String(cellValue).trim() : "";
        const currency = item.budgetCurrency || item.currency || "Not Set";
        return budgetValue.length === 0 ? (
          <span className="text-gray-400 italic">No Budget</span>
        ) : (
          `${currency} ${budgetValue}`
        );
      }

      case "halalStatus": {
        const halalValue = cellValue ? String(cellValue).trim() : "";
        return halalValue.length === 0 ? (
          <span className="text-gray-400 italic">No Halal Status</span>
        ) : (
          halalValue
        );
      }

      case "remarks": {
        const trimmedValue = cellValue ? String(cellValue).trim() : "";
        return trimmedValue.length === 0 ? (
          <span className="text-gray-400 italic">No remarks</span>
        ) : (
          <a
            href={trimmedValue}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline hover:text-blue-700"
          >
            Link
          </a>
        );
      }
      case "actions":
        return undefined;

      default:
        if (typeof cellValue === "object" && cellValue !== null) {
          return <span className="text-gray-400 italic">—</span>;
        }
        return String(cellValue || "—");
    }
  };

  return (
    <div className="text-black flex flex-col gap-6">
      <AdminHeader
        type="restaurant"
        assignments={assignments}
        evaluators={evaluators}
        establishments={establishments}
      />

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
        columns={restaurantColumns}
        data={paginatedRestaurants}
        handleEditItem={handleEditRestaurant}
        handleViewItem={handleViewRestaurant}
        handleDeleteItem={handleDeleteRestaurant}
        renderCell={renderRestaurantCell}
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
        isLoading={isSaving}
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
