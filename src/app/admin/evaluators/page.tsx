"use client";

import EntityModal, { FieldConfig } from "@/components/admin/EntityModal";
import { useState } from "react";

import TableComponent from "@/components/table/Table";
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
import Swal from "sweetalert2";

const columns = [
  { name: "ID", uid: "id" },
  { name: "Evaluator Name", uid: "name" },
  { name: "Specialties", uid: "specialties" },
  { name: "Email/Contact", uid: "email" },
  { name: "Phone Number", uid: "phone" },
  { name: "Current Position", uid: "position" },
  { name: "Company/Organization", uid: "company" },
  { name: "Actions", uid: "actions" },
];

// Dummy data removed - now using real data from Firebase
// const users = [...];

// Evaluator field configuration for the modal
const evaluatorFields: FieldConfig[] = [
  {
    name: "name",
    label: "Evaluator Name",
    type: "text",
    placeholder: "Type evaluator name...",
    required: true,
  },
  {
    name: "email",
    label: "Email/Contact",
    type: "email",
    placeholder: "evaluator@email.com",
    required: true,
  },
  {
    name: "phone",
    label: "Phone Number",
    type: "tel",
    placeholder: "+62xxx...",
  },
  {
    name: "position",
    label: "Current Position",
    type: "text",
    placeholder: "e.g., Chef Manager, Food Inspector",
  },
  {
    name: "company",
    label: "Company/Organization",
    type: "text",
    placeholder: "Organization name",
  },
  {
    name: "specialties",
    label: "Specialties",
    type: "text",
    placeholder: "e.g., Bakery, Italian, Fast Food",
  },
];

export default function EvaluatorsPage() {
  const [page, setPage] = React.useState(1);
  const [selectedCities, setSelectedCities] = React.useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = React.useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvaluator, setSelectedEvaluator] = useState<any>(null);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [evaluatorToDelete, setEvaluatorToDelete] = useState<any>(null);
  const [evaluators, setEvaluators] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch evaluators on component mount
  React.useEffect(() => {
    fetchEvaluators();
  }, []);

  const fetchEvaluators = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/evaluators");
      if (!response.ok) {
        throw new Error("Failed to fetch evaluators");
      }
      const data = await response.json();
      setEvaluators(data.evaluators || []);
    } catch (error) {
      console.error("Error fetching evaluators:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load evaluators",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEvaluator = () => {
    setSelectedEvaluator(null);
    setModalMode("add");
    setIsModalOpen(true);
  };

  const handleViewEvaluator = (evaluator: any) => {
    setSelectedEvaluator(evaluator);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleSaveEvaluator = async (evaluator: any) => {
    try {
      if (modalMode === "add") {
        // Create new evaluator
        const response = await fetch("/api/evaluators", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(evaluator),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create evaluator");
        }

        const result = await response.json();
        console.log("Evaluator created:", result);
        await Swal.fire({
          icon: "success",
          title: "Evaluator Created!",
          html: `
            <div class="text-left">
              <p><strong>ID:</strong> ${result.evaluator.id}</p>
              <p><strong>Email:</strong> ${result.evaluator.email}</p>
              <p class="mt-2">Login credentials have been sent to the evaluator's email address.</p>
            </div>
          `,
          confirmButtonColor: "#A67C37",
        });
      } else if (modalMode === "edit") {
        // Update existing evaluator
        const response = await fetch("/api/evaluators", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(evaluator),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update evaluator");
        }

        const result = await response.json();
        console.log("Evaluator updated:", result);
        await Swal.fire({
          icon: "success",
          title: "Success",
          text: "Evaluator updated successfully",
          confirmButtonColor: "#A67C37",
        });
      }

      setIsModalOpen(false);
      // Refresh the evaluators list
      await fetchEvaluators();
    } catch (error) {
      console.error("Error saving evaluator:", error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: error instanceof Error ? error.message : "Unknown error",
        confirmButtonColor: "#A67C37",
      });
    }
  };

  const handleEditEvaluator = (evaluator: any) => {
    setSelectedEvaluator(evaluator);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleDeleteEvaluator = (evaluator: any) => {
    setEvaluatorToDelete(evaluator);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      if (!evaluatorToDelete?.id) {
        throw new Error("Evaluator ID is missing");
      }

      const response = await fetch(
        `/api/evaluators?id=${evaluatorToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete evaluator");
      }

      const result = await response.json();
      console.log("Evaluator deleted:", result);
      await Swal.fire({
        icon: "success",
        title: "Success",
        text: "Evaluator deleted successfully",
        confirmButtonColor: "#A67C37",
      });

      setIsDeleteModalOpen(false);
      setEvaluatorToDelete(null);
      // Refresh the evaluators list
      await fetchEvaluators();
    } catch (error) {
      console.error("Error deleting evaluator:", error);
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
      <h2 className="text-2xl font-bold uppercase">Evaluator Management</h2>

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
          onPress={handleAddEvaluator}
        ></Button>
      </div>

      <div className="bg-white rounded-lg">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <p className="text-gray-500">Loading evaluators...</p>
          </div>
        ) : (
          <TableComponent
            columns={columns}
            data={evaluators}
            onEdit={handleEditEvaluator}
            onView={handleViewEvaluator}
            onDelete={handleDeleteEvaluator}
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
        onSave={handleSaveEvaluator}
        entity={selectedEvaluator}
        mode={modalMode}
        fields={evaluatorFields}
        title={{
          add: "ADD / EDIT EVALUATOR",
          edit: "ADD / EDIT EVALUATOR",
          view: "Detail Evaluator",
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
                  <span className="font-bold">{evaluatorToDelete?.name}</span>?
                  This action cannot be undone.
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
