"use client";

import EntityModal, { FieldConfig } from "@/components/admin/EntityModal";
import { useState } from "react";

import {

  Pagination,

} from "@nextui-org/react";
import React from "react";
import Swal from "sweetalert2";
import { useEvaluators } from "@/context/EvaluatorContext";
import EvaluatorFiltersSection from "@/components/admin/evaluatorpage/EvaluatorFiltersSection";
import EvaluatorTableSection from "@/components/admin/evaluatorpage/EvaluatorsTableSection";
import ConfirmDeleteModal from "@/components/admin/ConfirmDeleteModal";


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
  const { evaluators, isLoading, refetchEvaluators } = useEvaluators();


  const [page, setPage] = React.useState(1);
  const [selectedCities, setSelectedCities] = React.useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = React.useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvaluator, setSelectedEvaluator] = useState<any>(null);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [evaluatorToDelete, setEvaluatorToDelete] = useState<any>(null);
 

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
      await refetchEvaluators();
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
      await refetchEvaluators();
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

    <EvaluatorFiltersSection
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
      handleAddEvaluator={handleAddEvaluator}
    />
    <EvaluatorTableSection
      isLoading={isLoading}
      evaluators={evaluators}
      handleEditEvaluator={handleEditEvaluator}
      handleViewEvaluator={handleViewEvaluator}
      handleDeleteEvaluator={handleDeleteEvaluator}
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
    <ConfirmDeleteModal
      isOpen={isDeleteModalOpen}
      onClose={() => setIsDeleteModalOpen(false)}
      entityName={evaluatorToDelete?.name || ""}
      onConfirm={confirmDelete}
    />
    </div>
  );
}
