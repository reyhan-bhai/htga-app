"use client";

import AdminHeader from "@/components/admin/AdminHeader";
import AdminModal from "@/components/admin/AdminModal";
import AdminTable from "@/components/admin/AdminTable";
import AdminViewControl from "@/components/admin/AdminViewControl";
import { useAssignedContext } from "@/context/AssignedContext";
import {
  getEvaluatorViewData,
  getRestaurantViewData,
  handleEdit,
  handleSaveEdit,
  handleSaveManualMatch,
  handleSendCompletionReminder,
  handleSendNDAEmail,
  handleSendNDAReminder,
  handleViewDetails,
} from "@/lib/assignedPageUtils";

import { Pagination } from "@nextui-org/react";
import { useState, useMemo, useEffect } from "react";

export default function AssignedPage() {
  // Get data from context
  const {
    assignments,
    evaluators,
    establishments,
    isLoading,
    setIsLoading,
    fetchData,
  } = useAssignedContext();

  // Local state for UI
  const [selectedView, setSelectedView] = useState<string>("evaluator");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNDAStatus, setSelectedNDAStatus] = useState<string[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);
  const [selectedMatchStatus, setSelectedMatchStatus] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedEvaOneProgress, setSelectedEvaOneProgress] = useState<string[]>([]);
  const [selectedEvaTwoProgress, setSelectedEvaTwoProgress] = useState<string[]>([]);
  const [isManualMatchOpen, setIsManualMatchOpen] = useState(false);
  const [selectedEvaluator, setSelectedEvaluator] = useState<string>("");
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<any>(null);
  const [editEvaluator1, setEditEvaluator1] = useState<string>("");
  const [editEvaluator2, setEditEvaluator2] = useState<string>("");

  // Get evaluator and restaurant view data
  const evaluatorViewData = getEvaluatorViewData(evaluators, assignments);
  const restaurantViewData = getRestaurantViewData(
    establishments,
    assignments,
    evaluators
  );

  // Extract unique specialties from evaluators
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

  // Extract unique categories from establishments
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    establishments.forEach((establishment) => {
      if (establishment.category) {
        categories.add(establishment.category);
      }
    });
    return Array.from(categories).sort();
  }, [establishments]);

  // Filter evaluator view data
  const filteredEvaluatorData = useMemo(() => {
    let results = evaluatorViewData;

    // Filter by search query
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      results = results.filter((item) => {
        const searchFields = [
          item.evaluator_name || "",
          item.email || "",
          item.eva_id || "",
          item.phone || "",
          item.specialty || "",
        ];
        return searchFields.some((field) =>
          field.toLowerCase().includes(query)
        );
      });
    }

    // Filter by NDA Status
    if (selectedNDAStatus.length > 0) {
      results = results.filter((item) =>
        selectedNDAStatus.includes(item.nda_status)
      );
    }

    // Filter by Specialties
    if (selectedSpecialties.length > 0) {
      results = results.filter((item) => {
        const specialties = item.specialties || [];
        if (Array.isArray(specialties)) {
          return specialties.some((spec: string) =>
            selectedSpecialties.includes(spec)
          );
        }
        return selectedSpecialties.includes(specialties);
      });
    }

    // Filter by incomplete only
    if (showIncompleteOnly) {
      results = results.filter((item) => item.nda_status !== "Completed");
    }

    return results;
  }, [evaluatorViewData, searchQuery, selectedNDAStatus, selectedSpecialties, showIncompleteOnly]);

  // Filter restaurant view data
  const filteredRestaurantData = useMemo(() => {
    let results = restaurantViewData;

    // Filter by search query
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      results = results.filter((item) => {
        const searchFields = [
          item.name || "",
          item.category || "",
          item.date_assigned || "",
          item.evaluator_1 || "",
          item.evaluator_2 || "",
        ];
        return searchFields.some((field) =>
          field.toLowerCase().includes(query)
        );
      });
    }

    // Filter by Category
    if (selectedCategories.length > 0) {
      results = results.filter((item) =>
        selectedCategories.includes(item.category)
      );
    }

    // Filter by Match Status
    if (selectedMatchStatus.length > 0) {
      results = results.filter((item) =>
        selectedMatchStatus.includes(item.matched)
      );
    }

    // Filter by Evaluator 1 Progress
    if (selectedEvaOneProgress.length > 0) {
      results = results.filter((item) =>
        selectedEvaOneProgress.includes(item.evaluator1_progress)
      );
    }

    // Filter by Evaluator 2 Progress
    if (selectedEvaTwoProgress.length > 0) {
      results = results.filter((item) =>
        selectedEvaTwoProgress.includes(item.evaluator2_progress)
      );
    }

    return results;
  }, [restaurantViewData, searchQuery, selectedCategories, selectedMatchStatus, selectedEvaOneProgress, selectedEvaTwoProgress]);

  // Get current view's filtered data
  const currentFilteredData = selectedView === "evaluator" ? filteredEvaluatorData : filteredRestaurantData;

  // Calculate pagination
  const totalPages = Math.ceil(currentFilteredData.length / rowsPerPage);
  const paginatedData = currentFilteredData.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedView, searchQuery, selectedNDAStatus, selectedSpecialties, showIncompleteOnly, selectedCategories, selectedMatchStatus, selectedEvaOneProgress, selectedEvaTwoProgress]);

  // Reset page when rows per page changes
  useEffect(() => {
    setPage(1);
  }, [rowsPerPage]);

  // Helper functions
  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(specialty)
        ? prev.filter((s) => s !== specialty)
        : [...prev, specialty]
    );
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const toggleEvaOneProgress = (status: string) => {
    setSelectedEvaOneProgress((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const toggleEvaTwoProgress = (status: string) => {
    setSelectedEvaTwoProgress((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedNDAStatus([]);
    setSelectedSpecialties([]);
    setShowIncompleteOnly(false);
    setSelectedCategories([]);
    setSelectedMatchStatus([]);
    setSelectedEvaOneProgress([]);
    setSelectedEvaTwoProgress([]);
  };

  return (
    <div className="text-black flex flex-col gap-4 lg:gap-6 p-4 sm:p-6">
      {/* Header Section */}
      <AdminHeader
        type="assignment"
        assignments={assignments}
        establishments={establishments}
        setIsLoading={setIsLoading}
        fetchData={fetchData}
        setIsManualMatchOpen={setIsManualMatchOpen}
      />

      {/* View Toggle & Search/Filter Section */}
      <AdminViewControl
        type="assignment"
        selectedView={selectedView}
        setSelectedView={setSelectedView}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedNDAStatus={selectedNDAStatus}
        setSelectedNDAStatus={setSelectedNDAStatus}
        selectedSpecialties={selectedSpecialties}
        setSelectedSpecialties={setSelectedSpecialties}
        specialties={availableSpecialties}
        toggleSpecialty={toggleSpecialty}
        showIncompleteOnly={showIncompleteOnly}
        setShowIncompleteOnly={setShowIncompleteOnly}
        selectedMatchStatus={selectedMatchStatus}
        setSelectedMatchStatus={setSelectedMatchStatus}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        categories={availableCategories}
        toggleCategory={toggleCategory}
        selectedEvaOneProgress={selectedEvaOneProgress}
        setSelectedEvaOneProgress={setSelectedEvaOneProgress}
        selectedEvaTwoProgress={selectedEvaTwoProgress}
        setSelectedEvaTwoProgress={setSelectedEvaTwoProgress}
        toggleEvaOneProgress={toggleEvaOneProgress}
        toggleEvaTwoProgress={toggleEvaTwoProgress}
        activeFiltersCount={
          selectedNDAStatus.length +
          selectedSpecialties.length +
          (showIncompleteOnly ? 1 : 0) +
          selectedMatchStatus.length +
          selectedCategories.length +
          selectedEvaOneProgress.length +
          selectedEvaTwoProgress.length +
          (searchQuery.trim().length > 0 ? 1 : 0)
        }
        evaluatorViewData={evaluatorViewData}
        restaurantViewData={restaurantViewData}
        clearFilters={handleClearFilters}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={setRowsPerPage}
      />

      {/* Table Section */}
      <AdminTable
        type="assignment"
        selectedView={selectedView}
        isLoading={isLoading}
        evaluatorViewData={paginatedData.length > 0 && selectedView === "evaluator" ? paginatedData : []}
        restaurantViewData={paginatedData.length > 0 && selectedView === "restaurant" ? paginatedData : []}
        evaluators={evaluators}
        establishments={establishments}
        assignments={assignments}
        setEditingRestaurant={setEditingRestaurant}
        setEditEvaluator1={setEditEvaluator1}
        setEditEvaluator2={setEditEvaluator2}
        setIsEditModalOpen={setIsEditModalOpen}
        handleViewDetails={handleViewDetails}
        handleEdit={handleEdit}
        handleSendNDAEmail={handleSendNDAEmail}
        handleSendNDAReminder={handleSendNDAReminder}
        handleSendCompletionReminder={handleSendCompletionReminder}
      />

      {/* Pagination */}
      <div className="flex justify-center items-center mt-2 sm:mt-4">
        <div className="block lg:hidden">
          <Pagination
            isCompact
            showControls
            total={totalPages || 1}
            page={page}
            onChange={setPage}
            siblings={0}
            size="sm"
            classNames={{
              cursor: "bg-[#A67C37] text-white font-bold text-xs sm:text-sm",
              item: "text-xs sm:text-sm",
            }}
          />
        </div>
        <div className="hidden lg:block">
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

      {/* Manual Match Modal */}
      <AdminModal
        type="assignment"
        subtype="manual-match"
        isOpen={isManualMatchOpen}
        onClose={() => setIsManualMatchOpen(false)}
        selectedEvaluator={selectedEvaluator}
        setSelectedEvaluator={setSelectedEvaluator}
        selectedRestaurant={selectedRestaurant}
        setSelectedRestaurant={setSelectedRestaurant}
        evaluators={evaluators}
        establishments={establishments}
        assignments={assignments}
        setIsLoading={setIsLoading}
        fetchData={fetchData}
        handleSaveManualMatch={handleSaveManualMatch}
      />

      {/* Edit Assignment Modal */}
      <AdminModal
        type="assignment"
        subtype="edit"
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingRestaurant(null);
          setEditEvaluator1("");
          setEditEvaluator2("");
        }}
        editingRestaurant={editingRestaurant}
        setEditingRestaurant={setEditingRestaurant}
        editEvaluator1={editEvaluator1}
        setEditEvaluator1={setEditEvaluator1}
        editEvaluator2={editEvaluator2}
        setEditEvaluator2={setEditEvaluator2}
        evaluators={evaluators}
        assignments={assignments}
        establishments={establishments}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        fetchData={fetchData}
        handleSaveEdit={handleSaveEdit}
      />
    </div>
  );
}
