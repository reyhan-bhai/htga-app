"use client";

import AdminHeader from "@/components/admin/AdminHeader";
import AdminTable from "@/components/admin/AdminTable";
import AdminViewControl from "@/components/admin/AdminViewControl";
import { useAssignedContext } from "@/context/admin/AssignedContext";
import { Pagination } from "@nextui-org/react";
import { useEffect, useMemo, useState } from "react";

// Budget management specific columns
const budgetColumns = [
  { name: "Evaluator Name", uid: "evaluatorName" },
  { name: "Email", uid: "email" },
  { name: "Company/Organization", uid: "company" },
  { name: "Restaurant Name", uid: "restaurantName" },
  { name: "Date Assigned", uid: "dateAssigned" },
  { name: "Image Receipt", uid: "receipt" },
  { name: "Amount Spent", uid: "amountSpent" },
  { name: "Budget", uid: "budget" },
  { name: "Reimbursement", uid: "reimbursement" },
];

// Helper function to calculate reimbursement
const calculateReimbursement = (
  amountSpent: number,
  budget: number
): number => {
  return Math.min(amountSpent, budget);
};

// Helper function to get budget view data
const getBudgetViewData = (
  assignments: any[],
  evaluators: any[],
  establishments: any[]
) => {
  const budgetData: any[] = [];

  assignments.forEach((assignment) => {
    const establishment = establishments.find(
      (est) => est.id === assignment.establishmentId
    );

    // Add evaluator 1 data
    if (assignment.evaluator1Id) {
      const evaluator1 = evaluators.find(
        (evaluator) => evaluator.id === assignment.evaluator1Id
      );
      if (evaluator1 && establishment) {
        const budget = parseFloat(establishment.budget || "0");
        const amountSpent = 0; // Placeholder for now

        budgetData.push({
          id: `${assignment.id}-eval1`,
          assignmentId: assignment.id,
          evaluatorId: assignment.evaluator1Id,
          evaluatorName: evaluator1.name || "Unknown",
          email: evaluator1.email || "-",
          company: evaluator1.company || "-",
          restaurantName: establishment.name || "Unknown",
          dateAssigned:
            assignment.evaluator1AssignedAt || assignment.assignedAt || "-",
          receipt: "No image yet",
          amountSpent: amountSpent,
          budget: budget,
          reimbursement: calculateReimbursement(amountSpent, budget),
          evaluatorNumber: 1,
        });
      }
    }

    // Add evaluator 2 data
    if (assignment.evaluator2Id) {
      const evaluator2 = evaluators.find(
        (evaluator) => evaluator.id === assignment.evaluator2Id
      );
      if (evaluator2 && establishment) {
        const budget = parseFloat(establishment.budget || "0");
        const amountSpent = 0; // Placeholder for now

        budgetData.push({
          id: `${assignment.id}-eval2`,
          assignmentId: assignment.id,
          evaluatorId: assignment.evaluator2Id,
          evaluatorName: evaluator2.name || "Unknown",
          email: evaluator2.email || "-",
          company: evaluator2.company || "-",
          restaurantName: establishment.name || "Unknown",
          dateAssigned:
            assignment.evaluator2AssignedAt || assignment.assignedAt || "-",
          receipt: "No image yet",
          amountSpent: amountSpent,
          budget: budget,
          reimbursement: calculateReimbursement(amountSpent, budget),
          evaluatorNumber: 2,
        });
      }
    }
  });

  return budgetData;
};

export default function BudgetPage() {
  // Get data from context
  const { assignments, evaluators, establishments, isLoading } =
    useAssignedContext();

  // Local state for UI
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState<{
    start: string;
    end: string;
  }>({ start: "", end: "" });

  // Get budget view data
  const budgetViewData = useMemo(() => {
    return getBudgetViewData(assignments, evaluators, establishments);
  }, [assignments, evaluators, establishments]);

  // Filter budget data
  const filteredBudgetData = useMemo(() => {
    let results = budgetViewData;

    // Filter by search query
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      results = results.filter((item) => {
        const searchFields = [
          item.evaluatorName || "",
          item.email || "",
          item.company || "",
          item.restaurantName || "",
        ];
        return searchFields.some((field) =>
          field.toLowerCase().includes(query)
        );
      });
    }

    // Filter by date range
    if (selectedDateRange.start && selectedDateRange.end) {
      results = results.filter((item) => {
        if (!item.dateAssigned || item.dateAssigned === "-") return false;
        const assignedDate = new Date(item.dateAssigned);
        const startDate = new Date(selectedDateRange.start);
        const endDate = new Date(selectedDateRange.end);
        return assignedDate >= startDate && assignedDate <= endDate;
      });
    }

    return results;
  }, [budgetViewData, searchQuery, selectedDateRange]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredBudgetData.length / rowsPerPage);
  const paginatedData = filteredBudgetData.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedDateRange]);

  // Reset page when rows per page changes
  useEffect(() => {
    setPage(1);
  }, [rowsPerPage]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedDateRange({ start: "", end: "" });
  };

  const activeFiltersCount =
    (searchQuery.trim().length > 0 ? 1 : 0) +
    (selectedDateRange.start || selectedDateRange.end ? 1 : 0);

  return (
    <div className="text-black flex flex-col gap-4 lg:gap-6 p-4 sm:p-6">
      {/* Header Section */}
      <AdminHeader
        type="budget"
        title="Budget Management"
      />

      {/* View Control & Search/Filter Section */}
      <AdminViewControl
        type="budget"
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedDateRange={selectedDateRange}
        setSelectedDateRange={setSelectedDateRange}
        activeFiltersCount={activeFiltersCount}
        clearFilters={handleClearFilters}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={setRowsPerPage}
      />

      {/* Table Section */}
      <AdminTable
        type="budget"
        isLoading={isLoading}
        data={paginatedData}
        columns={budgetColumns}
        renderCell={(item: any, columnKey: React.Key) => {
          const cellValue = item[columnKey as keyof typeof item];

          switch (columnKey) {
            case "dateAssigned":
              if (!cellValue || cellValue === "-") {
                return (
                  <span className="text-gray-400 italic">Not assigned</span>
                );
              }
              return new Date(cellValue).toLocaleDateString();

            case "receipt":
              return (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 italic">{cellValue}</span>
                </div>
              );

            case "amountSpent":
              return (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 italic">
                    {cellValue === 0 ? "-" : `RM ${cellValue.toFixed(2)}`}
                  </span>
                </div>
              );

            case "budget":
              return (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-blue-600">
                    RM {cellValue.toFixed(2)}
                  </span>
                </div>
              );

            case "reimbursement":
              const budgetValue = item.budget || 0;
              const spentValue = item.amountSpent || 0;
              const reimbursementValue = calculateReimbursement(
                spentValue,
                budgetValue
              );

              return (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-green-600">
                    RM {reimbursementValue.toFixed(2)}
                  </span>
                </div>
              );

            default:
              return cellValue || "-";
          }
        }}
        emptyMessage={{
          title: "No Budget Data",
          description: "No evaluator budget data found.",
        }}
        hideActions={true}
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
    </div>
  );
}
