"use client";

import AdminHeader from "@/components/admin/AdminHeader";
import AdminTable from "@/components/admin/AdminTable";
import AdminViewControl from "@/components/admin/AdminViewControl";
import { useAssignedContext } from "@/context/admin/AssignedContext";
import { Pagination } from "@nextui-org/react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { MdEdit } from "react-icons/md";
import Swal from "sweetalert2";

// Budget management specific columns
const budgetColumns = [
  { name: "JEVA ID", uid: "jevaId" },
  { name: "Assign ID", uid: "assignId" },
  { name: "Evaluator Name", uid: "evaluatorName" },
  { name: "Email", uid: "email" },
  { name: "Company/Organization", uid: "company" },
  { name: "Restaurant Name", uid: "restaurantName" },
  { name: "Date Assigned", uid: "dateAssigned" },
  { name: "Image Receipt", uid: "receipt" },
  { name: "Amount Spent", uid: "amountSpent" },
  { name: "Budget", uid: "budget" },
  { name: "Reimbursement", uid: "reimbursement" },
  { name: "Actions", uid: "actions" },
];

// Helper function to calculate reimbursement
const calculateReimbursement = (
  amountSpent: number,
  budget: number,
): number => {
  return Math.min(amountSpent, budget);
};

interface ClaimInfo {
  receipt: string | null;
  amountSpent: number | null;
  currency: string | null;
}

const getClaimInfo = (
  assignment: any,
  slot: "evaluator1" | "evaluator2",
): ClaimInfo => {
  const slotKey = slot === "evaluator1" ? "JEVA_FIRST" : "JEVA_SECOND";
  const evaluatorData = assignment.evaluators?.[slotKey];

  const receipt =
    evaluatorData?.receiptUrl ||
    evaluatorData?.receipt ||
    assignment[
      slot === "evaluator1" ? "evaluator1Receipt" : "evaluator2Receipt"
    ] ||
    null;

  const rawAmount =
    evaluatorData?.amountSpent ??
    assignment[
      slot === "evaluator1" ? "evaluator1AmountSpent" : "evaluator2AmountSpent"
    ];

  const amountSpent =
    rawAmount === null || rawAmount === undefined
      ? null
      : Number.parseFloat(String(rawAmount));

  const currency =
    evaluatorData?.currency ||
    assignment[
      slot === "evaluator1" ? "evaluator1Currency" : "evaluator2Currency"
    ] ||
    null;

  return {
    receipt,
    amountSpent: Number.isNaN(amountSpent) ? null : amountSpent,
    currency,
  };
};

// Helper function to get budget view data
const getBudgetViewData = (
  assignments: any[],
  evaluators: any[],
  establishments: any[],
): any[] => {
  const budgetData: any[] = [];

  assignments.forEach((assignment) => {
    const establishment = establishments.find(
      (est) => est.id === assignment.establishmentId,
    );

    // Add evaluator 1 data
    if (assignment.evaluator1Id) {
      const evaluator1 = evaluators.find(
        (evaluator) => evaluator.id === assignment.evaluator1Id,
      );
      if (evaluator1 && establishment) {
        const budget = parseFloat(establishment.budget || "0");
        const claimInfo = getClaimInfo(assignment, "evaluator1");
        const amountSpent = claimInfo.amountSpent ?? 0;

        budgetData.push({
          id: `${assignment.id}-eval1`,
          assignmentId: assignment.id,
          evaluatorId: assignment.evaluator1Id,
          assignId: assignment.id,
          jevaId: assignment.evaluator1Id,
          evaluatorName: evaluator1.name || "Unknown",
          email: evaluator1.email || "-",
          company: evaluator1.company || "-",
          restaurantName: establishment.name || "Unknown",
          dateAssigned:
            assignment.evaluator1AssignedAt || assignment.assignedAt || "-",
          receipt: claimInfo.receipt,
          amountSpent: amountSpent,
          claimCurrency: claimInfo.currency || "Not Set",
          budget: budget,
          budgetCurrency: establishment.currency || "Not Set",
          reimbursement: calculateReimbursement(amountSpent, budget),
          evaluatorNumber: 1,
        });
      }
    }

    // Add evaluator 2 data
    if (assignment.evaluator2Id) {
      const evaluator2 = evaluators.find(
        (evaluator) => evaluator.id === assignment.evaluator2Id,
      );
      if (evaluator2 && establishment) {
        const budget = parseFloat(establishment.budget || "0");
        const claimInfo = getClaimInfo(assignment, "evaluator2");
        const amountSpent = claimInfo.amountSpent ?? 0;

        budgetData.push({
          id: `${assignment.id}-eval2`,
          assignmentId: assignment.id,
          evaluatorId: assignment.evaluator2Id,
          assignId: assignment.id,
          jevaId: assignment.evaluator2Id,
          evaluatorName: evaluator2.name || "Unknown",
          email: evaluator2.email || "-",
          company: evaluator2.company || "-",
          restaurantName: establishment.name || "Unknown",
          dateAssigned:
            assignment.evaluator2AssignedAt || assignment.assignedAt || "-",
          receipt: claimInfo.receipt,
          amountSpent: amountSpent,
          claimCurrency: claimInfo.currency || "Not Set",
          budget: budget,
          budgetCurrency: establishment.currency || "Not Set",
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
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [amountSpentRange, setAmountSpentRange] = useState({
    min: "",
    max: "",
  });
  const [budgetValueRange, setBudgetValueRange] = useState({
    min: "",
    max: "",
  });
  const [reimbursementRange, setReimbursementRange] = useState({
    min: "",
    max: "",
  });
  const [receiptStatus, setReceiptStatus] = useState<
    "all" | "uploaded" | "missing"
  >("all");
  const [uploadingReceiptId, setUploadingReceiptId] = useState<string | null>(
    null,
  );
  const [editReceiptItem, setEditReceiptItem] = useState<any | null>(null);
  const [editReceiptFile, setEditReceiptFile] = useState<File | null>(null);
  const [editReceiptPreview, setEditReceiptPreview] = useState<string | null>(
    null,
  );

  // Get budget view data
  const budgetViewData = useMemo(() => {
    return getBudgetViewData(assignments, evaluators, establishments);
  }, [assignments, evaluators, establishments]);

  // Filter budget data
  const filteredBudgetData = useMemo(() => {
    let results = budgetViewData;
    const parseRangeValue = (value: string) => {
      const trimmedValue = value.trim();
      if (!trimmedValue) {
        return null;
      }
      const parsedValue = Number.parseFloat(trimmedValue);
      return Number.isNaN(parsedValue) ? null : parsedValue;
    };

    const isWithinRange = (
      value: number | null | undefined,
      range: { min: string; max: string },
    ) => {
      const minValue = parseRangeValue(range.min);
      const maxValue = parseRangeValue(range.max);

      if (minValue === null && maxValue === null) {
        return true;
      }

      if (value === null || value === undefined || Number.isNaN(value)) {
        return false;
      }

      if (minValue !== null && value < minValue) {
        return false;
      }

      if (maxValue !== null && value > maxValue) {
        return false;
      }

      return true;
    };

    // Filter by search query
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      results = results.filter((item) => {
        const searchFields = [
          item.jevaId || "",
          item.assignId || "",
          item.evaluatorName || "",
          item.email || "",
          item.company || "",
          item.restaurantName || "",
        ];
        return searchFields.some((field) =>
          String(field).toLowerCase().includes(query),
        );
      });
    }

    results = results.filter((item) => {
      const amountSpent = item.amountSpent ?? null;
      const budgetValue = item.budget ?? null;
      const reimbursementValue = item.reimbursement ?? null;
      const hasReceipt = Boolean(item.receipt);
      const matchesReceiptStatus =
        receiptStatus === "all" ||
        (receiptStatus === "uploaded" && hasReceipt) ||
        (receiptStatus === "missing" && !hasReceipt);

      return (
        isWithinRange(amountSpent, amountSpentRange) &&
        isWithinRange(budgetValue, budgetValueRange) &&
        isWithinRange(reimbursementValue, reimbursementRange) &&
        matchesReceiptStatus
      );
    });

    return results;
  }, [
    budgetViewData,
    searchQuery,
    amountSpentRange,
    budgetValueRange,
    reimbursementRange,
    receiptStatus,
  ]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredBudgetData.length / rowsPerPage);
  const paginatedData = filteredBudgetData.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [
    searchQuery,
    amountSpentRange,
    budgetValueRange,
    reimbursementRange,
    receiptStatus,
  ]);

  // Reset page when rows per page changes
  useEffect(() => {
    setPage(1);
  }, [rowsPerPage]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setAmountSpentRange({ min: "", max: "" });
    setBudgetValueRange({ min: "", max: "" });
    setReimbursementRange({ min: "", max: "" });
    setReceiptStatus("all");
  };

  const handleReceiptUpload = async (
    item: any,
    file: File,
  ): Promise<boolean> => {
    if (!item?.assignmentId || !item?.evaluatorId) return false;

    try {
      setUploadingReceiptId(item.id);
      const formData = new FormData();
      formData.append("assignmentId", item.assignmentId);
      formData.append("evaluatorId", item.evaluatorId);
      formData.append("receipt", file);

      const response = await fetch("/api/admin/receipt-update", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error || "Failed to update receipt.");
      }
      await Swal.fire({
        icon: "success",
        title: "Receipt updated",
        text: "The receipt has been saved successfully.",
        confirmButtonColor: "#A67C37",
      });
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update receipt. Please try again.";
      console.error("[Budget] Receipt update failed:", error);
      await Swal.fire({
        icon: "error",
        title: "Receipt update failed",
        text: errorMessage,
        confirmButtonColor: "#A67C37",
      });
      return false;
    } finally {
      setUploadingReceiptId(null);
    }
  };

  useEffect(() => {
    if (!editReceiptFile) {
      setEditReceiptPreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(editReceiptFile);
    setEditReceiptPreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [editReceiptFile]);

  const handleOpenReceiptModal = (item: any) => {
    setEditReceiptItem(item);
    setEditReceiptFile(null);
    setEditReceiptPreview(null);
  };

  const handleCloseReceiptModal = () => {
    setEditReceiptItem(null);
    setEditReceiptFile(null);
    setEditReceiptPreview(null);
  };

  const activeFiltersCount =
    (searchQuery.trim().length > 0 ? 1 : 0) +
    ([amountSpentRange, budgetValueRange, reimbursementRange].filter(
      (range) => range.min.trim() || range.max.trim(),
    ).length || 0);
  const receiptFilterCount = receiptStatus === "all" ? 0 : 1;
  const totalActiveFilters = activeFiltersCount + receiptFilterCount;

  return (
    <div className="text-black flex flex-col gap-4 lg:gap-6 p-4 sm:p-6">
      {/* Header Section */}
      <AdminHeader
        type="budget"
        title="Budget Management"
        assignments={assignments}
        evaluators={evaluators}
        establishments={establishments}
      />

      {/* View Control & Search/Filter Section */}
      <AdminViewControl
        type="budget"
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        amountSpentRange={amountSpentRange}
        setAmountSpentRange={setAmountSpentRange}
        budgetValueRange={budgetValueRange}
        setBudgetValueRange={setBudgetValueRange}
        reimbursementRange={reimbursementRange}
        setReimbursementRange={setReimbursementRange}
        receiptStatus={receiptStatus}
        setReceiptStatus={setReceiptStatus}
        activeFiltersCount={totalActiveFilters}
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
            case "jevaId":
              return cellValue || "-";

            case "assignId":
              return cellValue || "-";

            case "evaluatorName":
              return cellValue || "-";

            case "email":
              return cellValue || "-";

            case "company":
              return cellValue || "-";

            case "restaurantName":
              return cellValue || "-";

            case "dateAssigned":
              if (!cellValue || cellValue === "-") {
                return (
                  <span className="text-gray-400 italic">Not assigned</span>
                );
              }
              return new Date(cellValue).toLocaleDateString();

            case "receipt":
              if (cellValue) {
                return (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewImage(cellValue)}
                      className="rounded-xl border border-gray-200 p-1 shadow-sm transition hover:border-[#A67C37]"
                    >
                      <Image
                        src={cellValue}
                        alt="Receipt thumbnail"
                        width={64}
                        height={64}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    </button>
                  </div>
                );
              }
              return (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 italic">No image yet</span>
                </div>
              );

            case "amountSpent":
              return (
                <div className="flex items-center gap-2">
                  <span className="text-black italic">
                    {!cellValue
                      ? "-"
                      : `${item.claimCurrency} ${cellValue.toFixed(2)}`}
                  </span>
                </div>
              );

            case "budget":
              return (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-blue-600 whitespace-nowrap">
                    {item.budgetCurrency} {cellValue.toFixed(2)}
                  </span>
                </div>
              );

            case "reimbursement":
              const budgetValue = item.budget || 0;
              const spentValue = item.amountSpent || 0;
              const reimbursementValue = calculateReimbursement(
                spentValue,
                budgetValue,
              );

              return (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-green-600">
                    {item.budgetCurrency} {reimbursementValue.toFixed(2)}
                  </span>
                </div>
              );

            case "actions": {
              const inputId = `receipt-upload-${item.id}`;
              const isUploading = uploadingReceiptId === item.id;

              return (
                <div className="flex items-center justify-center gap-2">
                  <label
                    htmlFor={inputId}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
                      isUploading
                        ? "bg-gray-200 text-gray-500 cursor-wait"
                        : "bg-white text-[#A67C37] border border-[#A67C37] hover:bg-[#A67C37] hover:text-white"
                    }`}
                    onClick={(event) => {
                      event.preventDefault();
                      handleOpenReceiptModal(item);
                    }}
                  >
                    <MdEdit size={14} />
                    Edit Receipt
                  </label>
                </div>
              );
            }

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

      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-3xl rounded-3xl bg-white p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-end">
              <button
                onClick={() => setPreviewImage(null)}
                className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-600"
              >
                Close
              </button>
            </div>
            <div className="mt-3 flex justify-center">
              <Image
                src={previewImage}
                alt="Receipt preview"
                width={900}
                height={700}
                className="max-h-[70vh] w-auto rounded-2xl object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {editReceiptItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          role="dialog"
          aria-modal="true"
          onClick={handleCloseReceiptModal}
        >
          <div
            className="w-full max-w-3xl rounded-3xl bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Edit Receipt
                </h2>
                <p className="text-sm text-gray-500">
                  Update the receipt for {editReceiptItem.evaluatorName || "-"}.
                </p>
                <div className="mt-3 grid gap-2 text-xs text-gray-600 sm:grid-cols-2">
                  <div className="rounded-xl bg-gray-50 px-3 py-2">
                    <span className="font-semibold text-gray-700">Name:</span>{" "}
                    {editReceiptItem.evaluatorName || "-"}
                  </div>
                  <div className="rounded-xl bg-gray-50 px-3 py-2">
                    <span className="font-semibold text-gray-700">
                      JEVA ID:
                    </span>{" "}
                    {editReceiptItem.jevaId || "-"}
                  </div>
                  <div className="rounded-xl bg-gray-50 px-3 py-2">
                    <span className="font-semibold text-gray-700">
                      Assign ID:
                    </span>{" "}
                    {editReceiptItem.assignId || "-"}
                  </div>
                  <div className="rounded-xl bg-gray-50 px-3 py-2">
                    <span className="font-semibold text-gray-700">
                      Restaurant:
                    </span>{" "}
                    {editReceiptItem.restaurantName || "-"}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-700">
                  Stored Receipt
                </p>
                {editReceiptItem.receipt ? (
                  <div className="mt-3 flex justify-center">
                    <Image
                      src={editReceiptItem.receipt}
                      alt="Stored receipt"
                      width={420}
                      height={320}
                      className="max-h-64 w-auto rounded-2xl object-contain"
                    />
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-gray-400 italic">
                    No receipt uploaded yet.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-700">
                  New Upload Preview
                </p>
                {editReceiptPreview ? (
                  <div className="mt-3 flex justify-center">
                    <Image
                      src={editReceiptPreview}
                      alt="Receipt preview"
                      width={420}
                      height={320}
                      className="max-h-64 w-auto rounded-2xl object-contain"
                    />
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-gray-400 italic">
                    Select an image to preview.
                  </p>
                )}
                <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#A67C37] px-4 py-2 text-sm font-semibold text-[#A67C37] transition hover:bg-[#A67C37] hover:text-white">
                  Choose Image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      setEditReceiptFile(file);
                      event.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseReceiptModal}
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  !editReceiptFile || uploadingReceiptId === editReceiptItem.id
                }
                onClick={async () => {
                  if (!editReceiptFile) return;
                  const didSave = await handleReceiptUpload(
                    editReceiptItem,
                    editReceiptFile,
                  );
                  if (didSave) {
                    handleCloseReceiptModal();
                  }
                }}
                className={`rounded-full px-4 py-2 text-sm font-semibold text-white transition ${
                  !editReceiptFile || uploadingReceiptId === editReceiptItem.id
                    ? "cursor-not-allowed bg-gray-300"
                    : "bg-[#A67C37] hover:bg-[#8f6a2f]"
                }`}
              >
                {uploadingReceiptId === editReceiptItem.id
                  ? "Saving..."
                  : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
