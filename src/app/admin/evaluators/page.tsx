"use client";

import AdminHeader from "@/components/admin/AdminHeader";
import AdminModal from "@/components/admin/AdminModal";
import AdminTable from "@/components/admin/AdminTable";
import AdminViewControl from "@/components/admin/AdminViewControl";
import { useAssignedContext } from "@/context/admin/AssignedContext";
import { useEvaluators } from "@/context/admin/EvaluatorContext";
import { Pagination } from "@nextui-org/react";
import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

const evaluatorColumns = [
  { name: "ID", uid: "id" },
  { name: "Evaluator Name", uid: "name" },
  { name: "Specialties", uid: "specialties" },
  { name: "Email/Contact", uid: "email" },
  { name: "Phone Number", uid: "phone" },
  { name: "Current Position", uid: "position" },
  { name: "Company/Organization", uid: "company" },
  { name: "Actions", uid: "actions" },
];

export default function EvaluatorsPage() {
  const { evaluators, isLoading, refetchEvaluators } = useEvaluators();
  const { fetchData: refetchAssignments } = useAssignedContext();

  const [page, setPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvaluator, setSelectedEvaluator] = useState<any>(null);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [evaluatorToDelete, setEvaluatorToDelete] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

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
    setIsSaving(true);
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
      await refetchAssignments();
    } catch (error) {
      console.error("Error saving evaluator:", error);
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
    setIsSaving(true);
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
      await refetchAssignments();
    } catch (error) {
      console.error("Error deleting evaluator:", error);
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

  const clearFilters = () => {
    setSelectedSpecialties([]);
    setSearchQuery("");
  };

  const activeFiltersCount = selectedSpecialties.length;

  // Extract unique specialties from evaluators data
  const availableSpecialties = useMemo(() => {
    const specialties = new Set<string>();
    evaluators.forEach((evaluator) => {
      if (evaluator.specialties) {
        if (Array.isArray(evaluator.specialties)) {
          evaluator.specialties.forEach((specialty: string) => {
            specialties.add(specialty);
          });
        } else if (typeof evaluator.specialties === "string") {
          specialties.add(evaluator.specialties);
        }
      }
    });
    return Array.from(specialties).sort();
  }, [evaluators]);

  // Create filtered evaluators based on selected specialties and search query
  const filteredEvaluators = useMemo(() => {
    let results = evaluators;

    // Filter by specialties
    if (selectedSpecialties.length > 0) {
      results = results.filter((evaluator) => {
        if (Array.isArray(evaluator.specialties)) {
          return evaluator.specialties.some((specialty: string) =>
            selectedSpecialties.includes(specialty)
          );
        } else if (typeof evaluator.specialties === "string") {
          return selectedSpecialties.includes(evaluator.specialties);
        }
        return false;
      });
    }

    // Filter by search query
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      results = results.filter((evaluator) => {
        const searchFields = [
          evaluator.name || "",
          evaluator.email || "",
          evaluator.id || "",
          evaluator.phone || "",
          evaluator.position || "",
          evaluator.company || "",
        ];

        // Check if query matches any of the basic fields
        const basicFieldMatch = searchFields.some((field) =>
          field.toLowerCase().includes(query)
        );

        // Check if query matches specialties
        let specialtyMatch = false;
        if (Array.isArray(evaluator.specialties)) {
          specialtyMatch = evaluator.specialties.some((specialty: string) =>
            specialty.toLowerCase().includes(query)
          );
        } else if (typeof evaluator.specialties === "string") {
          specialtyMatch = (evaluator.specialties as string)
            .toLowerCase()
            .includes(query);
        }

        return basicFieldMatch || specialtyMatch;
      });
    }

    return results;
  }, [evaluators, selectedSpecialties, searchQuery]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredEvaluators.length / rowsPerPage);

  // Get paginated evaluators
  const paginatedEvaluators = filteredEvaluators.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedSpecialties, searchQuery]);

  // Reset page to 1 when rows per page changes
  useEffect(() => {
    setPage(1);
  }, [rowsPerPage]);

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(specialty)
        ? prev.filter((s) => s !== specialty)
        : [...prev, specialty]
    );
  };

  return (
    <div className="text-black flex flex-col gap-6">
      <AdminHeader type="evaluator" />

      <AdminViewControl
        type="evaluator"
        selectedSpecialties={selectedSpecialties}
        setSelectedSpecialties={setSelectedSpecialties}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeFiltersCount={activeFiltersCount}
        specialties={availableSpecialties}
        toggleSpecialty={toggleSpecialty}
        clearFilters={clearFilters}
        handleAddEvaluator={handleAddEvaluator}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={setRowsPerPage}
      />
      <AdminTable
        type="evaluator"
        isLoading={isLoading}
        columns={evaluatorColumns}
        data={paginatedEvaluators}
        handleEditItem={handleEditEvaluator}
        handleViewItem={handleViewEvaluator}
        handleDeleteItem={handleDeleteEvaluator}
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
        type="evaluator"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEvaluator}
        entity={selectedEvaluator}
        mode={modalMode}
        isLoading={isSaving}
      />

      {/* Delete Confirmation Modal */}
      <AdminModal
        type="delete"
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        entityName={evaluatorToDelete?.name || ""}
        onConfirm={confirmDelete}
        isLoading={isSaving}
      />
    </div>
  );
}
