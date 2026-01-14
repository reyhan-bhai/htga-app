"use client";

import AdminHeader from "@/components/admin/AdminHeader";
import AdminModal from "@/components/admin/AdminModal";
import AdminTable from "@/components/admin/AdminTable";
import AdminViewControl from "@/components/admin/AdminViewControl";
import { useAssignedContext } from "@/context/admin/AssignedContext";
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
import { useEffect, useMemo, useState } from "react";

// Columns for Evaluator View
export const byEvaluatorColumns = [
  { name: "Eva ID", uid: "eva_id" },
  { name: "Name", uid: "name" },
  { name: "Email", uid: "email" },
  { name: "Phone", uid: "phone" },
  { name: "Specialty", uid: "specialty" },
  { name: "NDA Status", uid: "nda_status" },
  { name: "Send Reminder", uid: "nda_reminder" },
  // { name: "Rest. 1", uid: "restaurant_1" },
  // { name: "Rest. 2", uid: "restaurant_2" },
  { name: "Reminder Sent", uid: "total_reminder_sent" },
  { name: "Completed", uid: "restaurant_completed" },
];

// Columns for Restaurant View
export const byRestaurantColumns = [
  { name: "Name", uid: "name" },
  { name: "Category", uid: "category" },
  { name: "Matched", uid: "matched" },
  // { name: "Date Assigned", uid: "date_assigned" },
  { name: "Eva 1 Date Assigned", uid: "evaluator1_assigned_date" },
  { name: "Evaluator 1", uid: "evaluator_1" },
  { name: "Eva 1 Progress", uid: "completed_eva_1" },
  { name: "Evaluator 1 Receipt", uid: "evaluator1_receipt" },
  { name: "Evaluator 1 Amount Spent", uid: "evaluator1_amount_spent" },
  { name: "Eva 2 Date Assigned", uid: "evaluator2_assigned_date" },
  { name: "Evaluator 2", uid: "evaluator_2" },
  { name: "Eva 2 Progress", uid: "completed_eva_2" },
  { name: "Evaluator 2 Receipt", uid: "evaluator2_receipt" },
  { name: "Evaluator 2 Amount Spent", uid: "evaluator2_amount_spent" },
  { name: "Actions", uid: "actions" },
];

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
  const [selectedEvaOneProgress, setSelectedEvaOneProgress] = useState<
    string[]
  >([]);
  const [selectedEvaTwoProgress, setSelectedEvaTwoProgress] = useState<
    string[]
  >([]);
  const [selectedDateRange, setSelectedDateRange] = useState<{
    start: string;
    end: string;
  }>({ start: "", end: "" });
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
        } else if (
          typeof evaluator.specialties === "object" &&
          evaluator.specialties !== null
        ) {
          // Handle Firebase object structure
          Object.values(evaluator.specialties).forEach((specialty: any) => {
            if (typeof specialty === "string") {
              specialties.add(specialty);
            }
          });
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
          item.evaluator_name || item.name || "",
          item.email || "",
          item.eva_id || "",
          item.phone || "",
          item.specialty || "",
        ];
        return searchFields.some((field) => {
          // Safely convert to string and handle objects
          const fieldString =
            typeof field === "object" && field !== null
              ? JSON.stringify(field)
              : String(field || "");
          return fieldString.toLowerCase().includes(query);
        });
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
        // Handle case where specialties might be an object (Firebase structure)
        if (typeof specialties === "object" && specialties !== null) {
          const specialtyValues = Object.values(specialties);
          return specialtyValues.some((spec: any) =>
            selectedSpecialties.includes(String(spec))
          );
        }
        return selectedSpecialties.includes(String(specialties || ""));
      });
    }

    // Filter by incomplete only
    if (showIncompleteOnly) {
      results = results.filter((item) => item.nda_status !== "Completed");
    }

    return results;
  }, [
    evaluatorViewData,
    searchQuery,
    selectedNDAStatus,
    selectedSpecialties,
    showIncompleteOnly,
  ]);

  // Filter restaurant view data
  const filteredRestaurantData = useMemo(() => {
    console.log("=== FILTERING RESTAURANT DATA ===");
    console.log("Raw restaurantViewData:", restaurantViewData);

    let results = restaurantViewData;

    // Filter by search query
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      console.log("Applying search filter:", query);

      results = results.filter((item, index) => {
        console.log(`Item ${index}:`, item);

        const searchFields = [
          item.name || "",
          item.category || "",
          item.date_assigned || "",
          item.evaluator_1 || "",
          item.evaluator_2 || "",
          item.evaluator1_assigned_date || "",
          item.evaluator2_assigned_date || "",
        ];

        console.log(`Search fields for item ${index}:`, searchFields);

        return searchFields.some((field, fieldIndex) => {
          console.log(`  Field ${fieldIndex}:`, field, `Type: ${typeof field}`);

          // Check if field is an object
          if (typeof field === "object" && field !== null) {
            console.warn(
              `  ⚠️ WARNING: Field ${fieldIndex} is an object:`,
              field
            );
            console.warn(`  Object keys:`, Object.keys(field));
          }

          // Safely convert to string and handle objects
          const fieldString =
            typeof field === "object" && field !== null
              ? JSON.stringify(field)
              : String(field || "");

          return fieldString.toLowerCase().includes(query);
        });
      });

      console.log("Results after search filter:", results);
    }

    // Filter by Category
    if (selectedCategories.length > 0) {
      console.log("Applying category filter:", selectedCategories);
      results = results.filter((item) => {
        console.log(
          "Item category:",
          item.category,
          "Type:",
          typeof item.category
        );
        return selectedCategories.includes(item.category);
      });
      console.log("Results after category filter:", results);
    }

    // Filter by Match Status
    if (selectedMatchStatus.length > 0) {
      console.log("Applying match status filter:", selectedMatchStatus);
      results = results.filter((item) => {
        console.log(
          "Item matched:",
          item.matched,
          "Type:",
          typeof item.matched
        );
        return selectedMatchStatus.includes(item.matched);
      });
      console.log("Results after match status filter:", results);
    }

    // Filter by Evaluator 1 Progress
    if (selectedEvaOneProgress.length > 0) {
      console.log(
        "Applying evaluator 1 progress filter:",
        selectedEvaOneProgress
      );
      results = results.filter((item) => {
        console.log(
          "Item evaluator1_progress:",
          item.evaluator1_progress,
          "Type:",
          typeof item.evaluator1_progress
        );
        return selectedEvaOneProgress.includes(item.evaluator1_progress);
      });
      console.log("Results after evaluator 1 progress filter:", results);
    }

    // Filter by Evaluator 2 Progress
    if (selectedEvaTwoProgress.length > 0) {
      console.log(
        "Applying evaluator 2 progress filter:",
        selectedEvaTwoProgress
      );
      results = results.filter((item) => {
        console.log(
          "Item evaluator2_progress:",
          item.evaluator2_progress,
          "Type:",
          typeof item.evaluator2_progress
        );
        return selectedEvaTwoProgress.includes(item.evaluator2_progress);
      });
      console.log("Results after evaluator 2 progress filter:", results);
    }

    // Filter by Date Range
    if (selectedDateRange.start || selectedDateRange.end) {
      console.log("Applying date range filter:", selectedDateRange);
      results = results.filter((item) => {
        const eva1Date = item.evaluator1_assigned_date;
        const eva2Date = item.evaluator2_assigned_date;

        // Check if either evaluator has an assignment date within the range
        const checkDate = (dateStr: string) => {
          if (!dateStr) return false;

          const itemDate = new Date(dateStr);
          const startDate = selectedDateRange.start
            ? new Date(selectedDateRange.start)
            : null;
          const endDate = selectedDateRange.end
            ? new Date(selectedDateRange.end)
            : null;

          if (startDate && endDate) {
            return itemDate >= startDate && itemDate <= endDate;
          } else if (startDate) {
            return itemDate >= startDate;
          } else if (endDate) {
            return itemDate <= endDate;
          }
          return false;
        };

        return checkDate(eva1Date) || checkDate(eva2Date);
      });
      console.log("Results after date range filter:", results);
    }

    console.log("=== FINAL FILTERED RESULTS ===", results);

    // Deep inspection of final results
    results.forEach((item, index) => {
      console.log(`Final item ${index}:`);
      Object.entries(item).forEach(([key, value]) => {
        if (typeof value === "object" && value !== null) {
          console.error(`  ❌ OBJECT FOUND in key "${key}":`, value);
          console.error(`    Keys:`, Object.keys(value));
        } else {
          console.log(`  ✓ ${key}:`, value, `(${typeof value})`);
        }
      });
    });

    return results;
  }, [
    restaurantViewData,
    searchQuery,
    selectedCategories,
    selectedMatchStatus,
    selectedEvaOneProgress,
    selectedEvaTwoProgress,
    selectedDateRange,
  ]);

  // Get current view's filtered data
  const currentFilteredData =
    selectedView === "evaluator"
      ? filteredEvaluatorData
      : filteredRestaurantData;

  // Calculate pagination
  const totalPages = Math.ceil(currentFilteredData.length / rowsPerPage);
  const paginatedData = currentFilteredData.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [
    selectedView,
    searchQuery,
    selectedNDAStatus,
    selectedSpecialties,
    showIncompleteOnly,
    selectedCategories,
    selectedMatchStatus,
    selectedEvaOneProgress,
    selectedEvaTwoProgress,
    selectedDateRange,
  ]);

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
    setSelectedDateRange({ start: "", end: "" });
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
        selectedDateRange={selectedDateRange}
        setSelectedDateRange={setSelectedDateRange}
        activeFiltersCount={
          selectedNDAStatus.length +
          selectedSpecialties.length +
          (showIncompleteOnly ? 1 : 0) +
          selectedMatchStatus.length +
          selectedCategories.length +
          selectedEvaOneProgress.length +
          selectedEvaTwoProgress.length +
          (selectedDateRange.start || selectedDateRange.end ? 1 : 0) +
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
        columns={
          selectedView === "evaluator"
            ? byEvaluatorColumns
            : byRestaurantColumns
        }
        evaluatorViewData={
          paginatedData.length > 0 && selectedView === "evaluator"
            ? paginatedData
            : []
        }
        restaurantViewData={
          paginatedData.length > 0 && selectedView === "restaurant"
            ? paginatedData
            : []
        }
        // ... props handlers lainnya (handleEdit, dll) tetap sama
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
