"use client";

import AssignmentHeader from "@/components/admin/AssigmentHeader";
import AssignmentTableSection from "@/components/admin/AssignmentTableSection";
import AssignmentFiltersSection from "@/components/admin/AssignmentViewControl";
import EditAssignmentModal from "@/components/admin/EditAssignmentModal";
import ManualMatchModal from "@/components/admin/ManualMatchModal";
import { useAssignedContext } from "@/context/AssignedContext";
import {
  getActiveFiltersCount,
  getEvaluatorViewData,
  getRestaurantViewData,
  handleEdit,
  handleSaveEdit,
  handleSaveManualMatch,
  handleSendCompletionReminder,
  handleSendNDAEmail,
  handleSendNDAReminder,
  handleViewDetails,
} from "@/lib/adminPageUtils";

import { Pagination } from "@nextui-org/react";
import { useState } from "react";

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
  const [selectedNDAStatus, setSelectedNDAStatus] = useState<string[]>([]);
  const [selectedMatchStatus, setSelectedMatchStatus] = useState<string[]>([]);
  const [isManualMatchOpen, setIsManualMatchOpen] = useState(false);
  const [selectedEvaluator, setSelectedEvaluator] = useState<string>("");
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<any>(null);
  const [editEvaluator1, setEditEvaluator1] = useState<string>("");
  const [editEvaluator2, setEditEvaluator2] = useState<string>("");

  // Computed values
  const activeFiltersCount = getActiveFiltersCount(
    selectedNDAStatus,
    selectedMatchStatus
  );
  const evaluatorViewData = getEvaluatorViewData(evaluators, assignments);
  const restaurantViewData = getRestaurantViewData(
    establishments,
    assignments,
    evaluators
  );

  return (
    <div className="text-black flex flex-col gap-4 lg:gap-6 p-4 sm:p-6">
      {/* Header Section */}
      <AssignmentHeader
        assignments={assignments}
        establishments={establishments}
        setIsLoading={setIsLoading}
        fetchData={fetchData}
        setIsManualMatchOpen={setIsManualMatchOpen}
      />
      
      {/* View Toggle & Search/Filter Section */}
      <AssignmentFiltersSection
        selectedView={selectedView}
        setSelectedView={setSelectedView}
        selectedNDAStatus={selectedNDAStatus}
        setSelectedNDAStatus={setSelectedNDAStatus}
        selectedMatchStatus={selectedMatchStatus}
        setSelectedMatchStatus={setSelectedMatchStatus}
        activeFiltersCount={activeFiltersCount}
        evaluatorViewData={evaluatorViewData}
        restaurantViewData={restaurantViewData}
      />

      {/* Table Section */}
      <AssignmentTableSection
        selectedView={selectedView}
        isLoading={isLoading}
        evaluatorViewData={evaluatorViewData}
        restaurantViewData={restaurantViewData}
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
            total={10}
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
            total={10}
            page={page}
            onChange={setPage}
            classNames={{
              cursor: "bg-[#A67C37] text-white font-bold",
            }}
          />
        </div>
      </div>

      {/* Manual Match Modal */}
      <ManualMatchModal
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
      <EditAssignmentModal
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
