"use client";

import EntityModal, { FieldConfig } from "@/components/admin/EntityModal";
import { useState } from "react";
import Swal from "sweetalert2";

import TableComponent from "@/components/table/Table";
import { useRestaurants } from "@/context/RestaurantContext";
import {
  Button,
  Checkbox,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pagination,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@nextui-org/react";
import React from "react";
import { MdAdd, MdClose, MdFilterList, MdSearch } from "react-icons/md";

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

// Restaurant field configuration for the modal
const restaurantFields: FieldConfig[] = [
  {
    name: "name",
    label: "Restaurant Name",
    type: "text",
    placeholder: "Type your Restaurant Name...",
    required: true,
  },
  {
    name: "category",
    label: "Category",
    type: "text",
    placeholder: "e.g., Bakery, FastFood, Italian",
    required: true,
  },
  {
    name: "address",
    label: "Full Address",
    type: "textarea",
    placeholder: "Enter full address...",
    rows: 3,
  },
  {
    name: "contactInfo",
    label: "Restaurant Contact",
    type: "text",
    placeholder: "Contact / Website",
  },
  {
    name: "rating",
    label: "Rating",
    type: "text",
    placeholder: "e.g., 4.7",
  },
  {
    name: "budget",
    label: "Budget (MYR)",
    type: "text",
    placeholder: "e.g., 50",
  },
  {
    name: "halalStatus",
    label: "Halal Status",
    type: "select",
    placeholder: "Select Halal Status",
    options: ["Muslim-Owned", "Muslim-friendly", "Halal Certified by JAKIM"],
  },
  {
    name: "remarks",
    label: "Remarks",
    type: "textarea",
    placeholder: "Additional notes or source links...",
    rows: 2,
  },
];

export default function RestaurantsPage() {
  const { restaurants, isLoading, refetchRestaurants } = useRestaurants();
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
      <h2 className="text-2xl font-bold uppercase">Restaurant Management</h2>

      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 md:bg-transparent">
        <div className="flex flex-row gap-3 w-full md:w-auto items-center">
          {/* Search Input */}
          <Input
            placeholder="Search by name, email, ID, city or status..."
            className="w-full md:w-[350px]"
            size="sm"
            variant="bordered"
            startContent={<MdSearch className="text-black" size={18} />}
            classNames={{
              inputWrapper: "bg-white border-gray-300 rounded-md text-red",
              input: "text-black placeholder:text-gray-500",
            }}
          />

          {/* Filter Popover */}
          <Popover placement="bottom-start">
            <PopoverTrigger>
              <Button
                isIconOnly
                className="bg-white border border-gray-300 rounded-md relative overflow-visible"
                size="sm"
              >
                <MdFilterList size={20} className="text-gray-500" />
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#A67C37] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center z-10 border-2 border-white">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-4 w-[280px] bg-white shadow-lg rounded-lg">
              <div className="flex flex-col gap-4 text-black">
                {/* Header */}
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-base">Filters</span>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-[#A67C37] hover:underline flex items-center gap-1"
                    >
                      <MdClose size={14} />
                      Clear all
                    </button>
                  )}
                </div>

                <Divider className="bg-gray-200" />

                {/* City Filter */}
                <div className="flex flex-col gap-2">
                  <span className="font-medium text-sm text-gray-700">
                    City
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {cities.map((city) => (
                      <Checkbox
                        key={city}
                        size="sm"
                        isSelected={selectedCities.includes(city)}
                        onValueChange={() => toggleCity(city)}
                        classNames={{
                          label: "text-black text-sm",
                        }}
                      >
                        {city}
                      </Checkbox>
                    ))}
                  </div>
                </div>

                <Divider className="bg-gray-200" />

                {/* Status Filter */}
                <div className="flex flex-col gap-2">
                  <span className="font-medium text-sm text-gray-700">
                    Status
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {statuses.map((status) => (
                      <Checkbox
                        key={status}
                        size="sm"
                        isSelected={selectedStatus.includes(status)}
                        onValueChange={() => toggleStatus(status)}
                        classNames={{
                          label: "text-black text-sm",
                        }}
                      >
                        {status}
                      </Checkbox>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <Button
          className="bg-[#A67C37] text-white font-semibold rounded-full p-0"
          startContent={<MdAdd size={30} />}
          onPress={handleAddRestaurant}
        ></Button>
      </div>

      <div className="bg-white rounded-lg">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <p className="text-gray-500">Loading restaurants...</p>
          </div>
        ) : (
          <TableComponent
            columns={columns}
            data={restaurants}
            onEdit={handleEditRestaurant}
            onView={handleViewRestaurant}
            onDelete={handleDeleteRestaurant}
          />
        )}
      </div>

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

      <EntityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRestaurant}
        entity={selectedRestaurant}
        mode={modalMode}
        fields={restaurantFields}
        title={{
          add: "ADD / EDIT RESTAURANT",
          edit: "ADD / EDIT RESTAURANT",
          view: "Detail Restaurant",
        }}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-black">
                Confirm Delete
              </ModalHeader>
              <ModalBody>
                <p className="text-black">
                  Are you sure you want to delete{" "}
                  <span className="font-bold">
                    {restaurantToDelete?.eating_establishments}
                  </span>
                  ? This action cannot be undone.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="danger" onPress={confirmDelete}>
                  Delete
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
