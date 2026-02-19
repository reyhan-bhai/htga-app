"use client";

import AdminHeader from "@/components/admin/AdminHeader";
import AdminModal from "@/components/admin/AdminModal";
import AdminTable from "@/components/admin/AdminTable";
import AdminViewControl from "@/components/admin/AdminViewControl";
import { useAssignedContext } from "@/context/admin/AssignedContext";
import { handleSaveEdit } from "@/lib/assignedPageUtils";
import { db } from "@/lib/firebase";
import { Pagination } from "@nextui-org/react";
import { onValue, ref, update } from "firebase/database";
import { useEffect, useMemo, useState, type Key, type ReactNode } from "react";
import {
  MdAssignment,
  MdClose,
  MdReportProblem,
  MdRestaurantMenu,
} from "react-icons/md";
import Swal from "sweetalert2";

const requestColumns = [
  { name: "Request ID", uid: "id" },
  { name: "Date", uid: "date" },
  { name: "Evaluator ID", uid: "evaluator_id" },
  { name: "Submitter Name", uid: "submitter_name" },
  { name: "Restaurant Name", uid: "restaurant_name" },
  { name: "Category", uid: "category" },
  { name: "Address", uid: "address" },
  { name: "Notes", uid: "notes" },
  { name: "Status", uid: "status" }, // Pending, Approved, Rejected
  { name: "Actions", uid: "actions" },
];

// Kolom untuk Tab "Reports" (Laporan Masalah)
const reportColumns = [
  { name: "Report ID", uid: "id" },
  { name: "Date", uid: "date" },
  { name: "Evaluator ID", uid: "evaluator_id" },
  { name: "Assign ID", uid: "assign_id" },
  { name: "Reporter", uid: "reporter_name" },
  { name: "Restaurant Name", uid: "restaurant_name" },
  { name: "Issue Type", uid: "issue_type" }, // Closed, Food Poisoning, etc
  { name: "Description", uid: "description" },
  { name: "Status", uid: "status" }, // Open, Resolved, Ignored
  { name: "Actions", uid: "actions" },
];

// Kolom untuk Tab "Re-assign Request"
const reassignColumns = [
  { name: "Re-assign ID", uid: "id" },
  { name: "Date", uid: "date" },
  { name: "Evaluator ID", uid: "evaluator_id" },
  { name: "Assign ID", uid: "assign_id" },
  { name: "Evaluator Name", uid: "evaluator_name" },
  { name: "Restaurant Name", uid: "restaurant_name" },
  { name: "Reason", uid: "reason" },
  { name: "Status", uid: "status" }, // Open, Resolved, Ignored

  { name: "Actions", uid: "actions" },
];

export default function FeedbackPage() {
  // State
  const [selectedView, setSelectedView] = useState<string>("request"); // 'request' | 'report' | 'reassign'
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilters, setStatusFilters] = useState<
    Record<"request" | "report" | "reassign", string[]>
  >({
    request: [],
    report: [],
    reassign: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [requestData, setRequestData] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [reassignData, setReassignData] = useState<any[]>([]);
  const [isRestaurantModalOpen, setIsRestaurantModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [selectedReassign, setSelectedReassign] = useState<any | null>(null);
  const [editingRestaurant, setEditingRestaurant] = useState<any>(null);
  const [editEvaluator1, setEditEvaluator1] = useState<string>("");
  const [editEvaluator2, setEditEvaluator2] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);

  const { assignments, evaluators, establishments, fetchData } =
    useAssignedContext();

  const totalFeedbackCount =
    requestData.length + reportData.length + reassignData.length;

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("feedbackLastSeenTotal", String(totalFeedbackCount));
    window.dispatchEvent(new Event("feedback:seen"));
  }, [totalFeedbackCount]);

  useEffect(() => {
    let isMounted = true;
    let readyCount = 0;

    const markReady = () => {
      readyCount += 1;
      if (readyCount >= 3 && isMounted) {
        setIsLoading(false);
      }
    };

    const requestsRef = ref(db, "restaurantRequests");
    const reportsRef = ref(db, "reportRequests");
    const reassignRef = ref(db, "reassignRequests");

    const requestUnsub = onValue(requestsRef, (snapshot) => {
      if (!isMounted) return;
      if (!snapshot.exists()) {
        setRequestData([]);
        markReady();
        return;
      }
      const data = snapshot.val();
      const mapped = Object.entries(data).map(([id, value]) => ({
        id,
        ...(value as Record<string, unknown>),
      }));
      setRequestData(mapped);
      markReady();
    });

    const reportUnsub = onValue(reportsRef, (snapshot) => {
      if (!isMounted) return;
      if (!snapshot.exists()) {
        setReportData([]);
        markReady();
        return;
      }
      const data = snapshot.val();
      const mapped = Object.entries(data).map(([id, value]) => ({
        id,
        ...(value as Record<string, unknown>),
      }));
      setReportData(mapped);
      markReady();
    });

    const reassignUnsub = onValue(reassignRef, (snapshot) => {
      if (!isMounted) return;
      if (!snapshot.exists()) {
        setReassignData([]);
        markReady();
        return;
      }
      const data = snapshot.val();
      const mapped = Object.entries(data).map(([id, value]) => ({
        id,
        ...(value as Record<string, unknown>),
      }));
      setReassignData(mapped);
      markReady();
    });

    return () => {
      isMounted = false;
      requestUnsub();
      reportUnsub();
      reassignUnsub();
    };
  }, []);

  // --- FILTER LOGIC (Sederhana untuk Mock Data) ---

  const filteredData = useMemo(() => {
    // 1. Pilih data source berdasarkan tab
    let data: Record<string, unknown>[] =
      selectedView === "request"
        ? requestData
        : selectedView === "report"
          ? reportData
          : reassignData;

    // 2. Filter Search
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      data = data.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(query),
        ),
      );
    }

    const activeStatusFilters =
      statusFilters[selectedView as "request" | "report" | "reassign"] || [];
    if (activeStatusFilters.length > 0) {
      data = data.filter((item) =>
        activeStatusFilters.includes(String(item.status || "")),
      );
    }

    // 3. (Optional) Filter Status jika nanti diimplementasikan
    // if (selectedStatus.length > 0) ...

    return data;
  }, [
    selectedView,
    searchQuery,
    requestData,
    reportData,
    reassignData,
    statusFilters,
  ]);
  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  const requestViewData = selectedView === "request" ? paginatedData : [];
  const reportViewData = selectedView === "report" ? paginatedData : [];
  const reassignViewData = selectedView === "reassign" ? paginatedData : [];

  useEffect(() => {
    setPage(1);
    setSearchQuery("");
  }, [selectedView]);

  // Handlers Placeholder
  const handleViewDetails = (item: any) => {
    console.log("View Details:", item);
  };

  const handleResolve = (item: any) => {
    console.log("Resolve/Approve:", item);
  };

  const handleOpenRestaurantModal = (item: any) => {
    setSelectedRequest(item);
    setIsRestaurantModalOpen(true);
  };

  const handleSaveRestaurant = async (data: any) => {
    if (!selectedRequest) return;

    setActionLoading(true);
    try {
      const response = await fetch("/api/admin/establishments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create restaurant");
      }

      const result = await response.json();

      await update(ref(db, `restaurantRequests/${selectedRequest.id}`), {
        status: "Approved",
        establishmentId: result.establishment?.id || null,
        approvedAt: new Date().toISOString(),
      });

      await Swal.fire({
        icon: "success",
        title: "Restaurant Added",
        text: "Request has been added to establishments.",
        confirmButtonColor: "#A67C37",
      });

      setIsRestaurantModalOpen(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error("Error saving restaurant request:", error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: error instanceof Error ? error.message : "Failed to add request",
        confirmButtonColor: "#A67C37",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleKillRestaurant = async (item: any) => {
    if (!item.assign_id) {
      await Swal.fire({
        icon: "error",
        title: "Missing Assign ID",
        text: "This report does not have an assignment ID.",
        confirmButtonColor: "#A67C37",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Remove evaluators from this restaurant?",
      text: "This will delete the assignment so the restaurant has no evaluators.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#A67C37",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, remove",
    });

    if (!result.isConfirmed) return;

    setActionLoading(true);
    try {
      const response = await fetch(
        `/api/admin/assignments?id=${item.assign_id}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove assignment");
      }

      await update(ref(db, `reportRequests/${item.id}`), {
        status: "Resolved",
        resolvedAt: new Date().toISOString(),
      });

      await Swal.fire({
        icon: "success",
        title: "Assignment Removed",
        text: "Evaluators removed for this restaurant.",
        confirmButtonColor: "#A67C37",
      });
    } catch (error) {
      console.error("Error removing assignment:", error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to remove assignment",
        confirmButtonColor: "#A67C37",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReassignModal = async (item: any) => {
    const assignment = assignments.find((a) => a.id === item.assign_id);
    if (!assignment) {
      await Swal.fire({
        icon: "error",
        title: "Assignment Not Found",
        text: "Could not find assignment for this request.",
        confirmButtonColor: "#A67C37",
      });
      return;
    }

    const establishment = establishments.find(
      (est) => est.id === assignment.establishmentId,
    );

    if (!establishment) {
      await Swal.fire({
        icon: "error",
        title: "Restaurant Not Found",
        text: "Could not find restaurant for this assignment.",
        confirmButtonColor: "#A67C37",
      });
      return;
    }

    const evaluatorsData = assignment.evaluators || {};
    const jevaFirst = evaluatorsData.JEVA_FIRST;
    const jevaSecond = evaluatorsData.JEVA_SECOND;

    const evaluatorOneId = jevaFirst?.evaluatorId || assignment.evaluator1Id;
    const evaluatorTwoId = jevaSecond?.evaluatorId || assignment.evaluator2Id;
    const targetEvaluatorId = item.evaluator_id;

    if (targetEvaluatorId === evaluatorTwoId) {
      setEditEvaluator1(targetEvaluatorId || "");
      setEditEvaluator2(evaluatorOneId || "");
    } else {
      setEditEvaluator1(targetEvaluatorId || evaluatorOneId || "");
      setEditEvaluator2(evaluatorTwoId || "");
    }
    setEditingRestaurant({
      res_id: establishment.id,
      name: establishment.name,
      category: establishment.category,
    });
    setSelectedReassign(item);
    setIsReassignModalOpen(true);
  };

  const handleReassignSave = async (
    editingRestaurantInput: any,
    editEvaluator1Input: string,
    editEvaluator2Input: string,
    assignmentsInput: any[],
    establishmentsInput: any[],
    evaluatorsInput: any[],
    setIsLoadingInput: (loading: boolean) => void,
    fetchDataInput: () => Promise<void>,
    setIsEditModalOpenInput: (open: boolean) => void,
    setEditingRestaurantInput: (restaurant: any) => void,
    setEditEvaluator1Input: (id: string) => void,
    setEditEvaluator2Input: (id: string) => void,
  ) => {
    const success = await handleSaveEdit(
      editingRestaurantInput,
      editEvaluator1Input,
      editEvaluator2Input,
      assignmentsInput,
      establishmentsInput,
      evaluatorsInput,
      setIsLoadingInput,
      fetchDataInput,
      setIsEditModalOpenInput,
      setEditingRestaurantInput,
      setEditEvaluator1Input,
      setEditEvaluator2Input,
    );

    if (success) {
      if (selectedReassign?.id) {
        // 1. Mark the reassign request as Approved
        await update(ref(db, `reassignRequests/${selectedReassign.id}`), {
          status: "Approved",
          resolvedAt: new Date().toISOString(),
        });

        // 2. Remove the evaluator from the OLD assignment so the
        //    "Reassigned" card disappears from the user's dashboard.
        const oldAssignId = selectedReassign.assign_id;
        const evaluatorId = selectedReassign.evaluator_id;

        if (oldAssignId && evaluatorId) {
          const oldAssignment = assignments.find((a) => a.id === oldAssignId);

          if (oldAssignment) {
            const oldUpdates: Record<string, any> = {};

            // Handle JEVA slot structure
            if (oldAssignment.evaluators) {
              const jevaFirst = oldAssignment.evaluators.JEVA_FIRST;
              const jevaSecond = oldAssignment.evaluators.JEVA_SECOND;

              if (jevaFirst?.evaluatorId === evaluatorId) {
                oldUpdates[
                  `assignments/${oldAssignId}/evaluators/JEVA_FIRST/evaluatorId`
                ] = null;
                oldUpdates[
                  `assignments/${oldAssignId}/evaluators/JEVA_FIRST/status`
                ] = null;
                oldUpdates[
                  `assignments/${oldAssignId}/evaluators/JEVA_FIRST/evaluatorStatus`
                ] = null;
                // Also clear the legacy flat fields
                oldUpdates[`assignments/${oldAssignId}/evaluator1Id`] = null;
                oldUpdates[`assignments/${oldAssignId}/evaluator1Status`] =
                  null;
                oldUpdates[`assignments/${oldAssignId}/evaluator1UniqueID`] =
                  null;
              }

              if (jevaSecond?.evaluatorId === evaluatorId) {
                oldUpdates[
                  `assignments/${oldAssignId}/evaluators/JEVA_SECOND/evaluatorId`
                ] = null;
                oldUpdates[
                  `assignments/${oldAssignId}/evaluators/JEVA_SECOND/status`
                ] = null;
                oldUpdates[
                  `assignments/${oldAssignId}/evaluators/JEVA_SECOND/evaluatorStatus`
                ] = null;
                // Also clear the legacy flat fields
                oldUpdates[`assignments/${oldAssignId}/evaluator2Id`] = null;
                oldUpdates[`assignments/${oldAssignId}/evaluator2Status`] =
                  null;
                oldUpdates[`assignments/${oldAssignId}/evaluator2UniqueID`] =
                  null;
              }
            } else {
              // Legacy flat structure
              if (oldAssignment.evaluator1Id === evaluatorId) {
                oldUpdates[`assignments/${oldAssignId}/evaluator1Id`] = null;
                oldUpdates[`assignments/${oldAssignId}/evaluator1Status`] =
                  null;
                oldUpdates[`assignments/${oldAssignId}/evaluator1UniqueID`] =
                  null;
              }
              if (oldAssignment.evaluator2Id === evaluatorId) {
                oldUpdates[`assignments/${oldAssignId}/evaluator2Id`] = null;
                oldUpdates[`assignments/${oldAssignId}/evaluator2Status`] =
                  null;
                oldUpdates[`assignments/${oldAssignId}/evaluator2UniqueID`] =
                  null;
              }
            }

            if (Object.keys(oldUpdates).length > 0) {
              await update(ref(db), oldUpdates);
            }
          }
        }
      }
      setSelectedReassign(null);
    }
  };

  const handleDecline = async (item: any) => {
    let updatePath = "";
    let newStatus = "";
    let confirmTitle = "";
    let confirmText = "";
    let successText = "Request declined.";

    switch (selectedView) {
      case "request":
        updatePath = `restaurantRequests/${item.id}`;
        newStatus = "Rejected";
        confirmTitle = "Decline Request";
        confirmText =
          "Are you sure you want to decline this restaurant request?";
        break;
      case "report":
        updatePath = `reportRequests/${item.id}`;
        newStatus = "Ignored";
        confirmTitle = "Ignore Report";
        confirmText = "Are you sure you want to ignore this report?";
        successText = "Report ignored.";
        break;
      case "reassign":
        updatePath = `reassignRequests/${item.id}`;
        newStatus = "Rejected";
        confirmTitle = "Decline Reassign";
        confirmText =
          "Are you sure you want to decline this re-assign request? The assignment status will be reverted to 'Pending'.";
        break;
      default:
        return;
    }

    const result = await Swal.fire({
      title: confirmTitle,
      text: confirmText,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, proceed",
    });

    if (!result.isConfirmed) return;

    setActionLoading(true);
    try {
      const updates: Record<string, any> = {};
      updates[`${updatePath}/status`] = newStatus;
      updates[`${updatePath}/resolvedAt`] = new Date().toISOString();

      // For Reassign/Report: Revert assignment status to 'pending'
      if (
        (selectedView === "reassign" || selectedView === "report") &&
        item.assign_id
      ) {
        const assignment = assignments.find((a) => a.id === item.assign_id);
        if (assignment) {
          if (assignment.evaluators) {
            // Check JEVA_FIRST
            if (
              assignment.evaluators.JEVA_FIRST?.evaluatorId ===
              item.evaluator_id
            ) {
              updates[
                `assignments/${item.assign_id}/evaluators/JEVA_FIRST/status`
              ] = "pending";
              updates[
                `assignments/${item.assign_id}/evaluators/JEVA_FIRST/evaluatorStatus`
              ] = "pending";
            }
            // Check JEVA_SECOND
            else if (
              assignment.evaluators.JEVA_SECOND?.evaluatorId ===
              item.evaluator_id
            ) {
              updates[
                `assignments/${item.assign_id}/evaluators/JEVA_SECOND/status`
              ] = "pending";
              updates[
                `assignments/${item.assign_id}/evaluators/JEVA_SECOND/evaluatorStatus`
              ] = "pending";
            }
          } else {
            // Legacy
            if (assignment.evaluator1Id === item.evaluator_id) {
              updates[`assignments/${item.assign_id}/evaluator1Status`] =
                "pending";
            } else if (assignment.evaluator2Id === item.evaluator_id) {
              updates[`assignments/${item.assign_id}/evaluator2Status`] =
                "pending";
            }
          }
        }
      }

      await update(ref(db), updates);

      await Swal.fire({
        icon: "success",
        title: "Success",
        text: successText,
        confirmButtonColor: "#A67C37",
      });
    } catch (error) {
      console.error("Error processing request:", error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to process request.",
        confirmButtonColor: "#A67C37",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const renderFeedbackCell = (item: any, columnKey: Key): ReactNode => {
    const cellValue = item[columnKey as keyof typeof item];
    const baseActionClass =
      "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] sm:text-xs font-semibold transition-all";
    const labelClass = "hidden sm:inline";
    const iconClass = "text-xs sm:text-sm";

    switch (columnKey) {
      case "id":
        return cellValue || "—";

      case "submitter_name":
        return cellValue || "—";

      case "restaurant_name":
        return cellValue || "—";

      case "category":
        return cellValue || "—";

      case "address":
        return cellValue || "—";

      case "notes":
        return cellValue || "—";

      case "date":
        if (!cellValue) {
          return <span className="text-gray-400 italic">-</span>;
        }
        return new Date(String(cellValue)).toLocaleDateString();

      case "reporter_name":
        return cellValue || "—";

      case "issue_type":
        return cellValue || "—";

      case "description":
        return cellValue || "—";

      case "evaluator_id":
        return cellValue || "—";

      case "assign_id":
        return cellValue || "—";

      case "evaluator_name":
        return cellValue || "—";

      case "reason":
        return cellValue || "—";

      case "status": {
        const status = String(cellValue || "");
        if (!status) {
          return <span className="text-gray-400 italic">-</span>;
        }

        const statusConfig: Record<
          string,
          { bg: string; text: string; border: string }
        > = {
          Pending: {
            bg: "bg-amber-50",
            text: "text-amber-700",
            border: "border-amber-200",
          },
          Approved: {
            bg: "bg-green-50",
            text: "text-green-700",
            border: "border-green-200",
          },
          Rejected: {
            bg: "bg-red-50",
            text: "text-red-700",
            border: "border-red-200",
          },
          Open: {
            bg: "bg-amber-50",
            text: "text-amber-700",
            border: "border-amber-200",
          },
          Resolved: {
            bg: "bg-green-50",
            text: "text-green-700",
            border: "border-green-200",
          },
          Ignored: {
            bg: "bg-gray-100",
            text: "text-gray-600",
            border: "border-gray-200",
          },
        };

        const config = statusConfig[status] || {
          bg: "bg-gray-100",
          text: "text-gray-600",
          border: "border-gray-200",
        };

        return (
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${config.bg} ${config.text} ${config.border}`}
          >
            {status}
          </span>
        );
      }

      case "actions":
        const isCompleted =
          ["Approved", "Resolved", "Rejected", "Ignored"].includes(
            String(item.status || ""),
          ) || actionLoading;

        if (selectedView === "request") {
          return (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleOpenRestaurantModal(item)}
                disabled={isCompleted}
                className={`${baseActionClass} ${
                  isCompleted
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                }`}
                title="Add to Restaurant"
              >
                <MdRestaurantMenu className={iconClass} />
                <span className={labelClass}>Add</span>
              </button>
              <button
                type="button"
                onClick={() => handleDecline(item)}
                disabled={isCompleted}
                className={`${baseActionClass} ${
                  isCompleted
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "bg-white text-red-600 border-red-200 hover:bg-red-50"
                }`}
                title="Decline Request"
              >
                <MdClose className={iconClass} />
                <span className={labelClass}>Decline</span>
              </button>
            </div>
          );
        }

        if (selectedView === "report") {
          return (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleKillRestaurant(item)}
                disabled={isCompleted}
                className={`${baseActionClass} ${
                  isCompleted
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                }`}
                title="Kill Restaurant"
              >
                <MdReportProblem className={iconClass} />
                <span className={labelClass}>Kill</span>
              </button>
              <button
                type="button"
                onClick={() => handleDecline(item)}
                disabled={isCompleted}
                className={`${baseActionClass} ${
                  isCompleted
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
                title="Ignore Report"
              >
                <MdClose className={iconClass} />
                <span className={labelClass}>Ignore</span>
              </button>
            </div>
          );
        }

        if (selectedView === "reassign") {
          return (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleOpenReassignModal(item)}
                disabled={isCompleted}
                className={`${baseActionClass} ${
                  isCompleted
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                }`}
                title="Reassign Evaluator"
              >
                <MdAssignment className={iconClass} />
                <span className={labelClass}>Reassign</span>
              </button>
              <button
                type="button"
                onClick={() => handleDecline(item)}
                disabled={isCompleted}
                className={`${baseActionClass} ${
                  isCompleted
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "bg-white text-red-600 border-red-200 hover:bg-red-50"
                }`}
                title="Decline Reassign"
              >
                <MdClose className={iconClass} />
                <span className={labelClass}>Decline</span>
              </button>
            </div>
          );
        }

        return undefined;

      default:
        if (typeof cellValue === "object" && cellValue !== null) {
          return <span className="text-gray-400 italic">—</span>;
        }
        return String(cellValue || "—");
    }
  };

  return (
    <div className="text-black flex flex-col gap-4 lg:gap-6 p-4 sm:p-6">
      {/* Header Section */}
      <AdminHeader type="assignment" assignments={[]} establishments={[]} />
      {/* View Control (Tab Switcher & Filter) */}
      <AdminViewControl
        type="assignment"
        tabOptions={[
          {
            key: "request",
            label: "Restaurant Request",
            shortLabel: "Request",
            icon: (
              <MdRestaurantMenu
                size={16}
                className="w-[14px] h-[14px] sm:w-[18px] sm:h-[18px]"
              />
            ),
          },
          {
            key: "report",
            label: "Report",
            shortLabel: "Report",
            icon: (
              <MdReportProblem
                size={16}
                className="w-[14px] h-[14px] sm:w-[18px] sm:h-[18px]"
              />
            ),
          },
          {
            key: "reassign",
            label: "Re-assign Request",
            shortLabel: "Re-assign",
            icon: (
              <MdAssignment
                size={16}
                className="w-[14px] h-[14px] sm:w-[18px] sm:h-[18px]"
              />
            ),
          },
        ]}
        searchPlaceholders={{
          request: "Search by submitter, restaurant, category, or status...",
          report: "Search by reporter, assignment, issue type, or status...",
          reassign:
            "Search by JEVA ID, assign ID, evaluator, restaurant, or reason...",
        }}
        showAssignmentStats={false}
        selectedView={selectedView}
        setSelectedView={setSelectedView}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedNDAStatus={[]}
        setSelectedNDAStatus={() => {}}
        selectedSpecialties={[]}
        setSelectedSpecialties={() => {}}
        specialties={[]}
        toggleSpecialty={() => {}}
        showIncompleteOnly={false}
        setShowIncompleteOnly={() => {}}
        selectedMatchStatus={[]}
        setSelectedMatchStatus={() => {}}
        selectedCategories={[]}
        setSelectedCategories={() => {}}
        categories={[]}
        toggleCategory={() => {}}
        selectedEvaOneProgress={[]}
        setSelectedEvaOneProgress={() => {}}
        selectedEvaTwoProgress={[]}
        setSelectedEvaTwoProgress={() => {}}
        toggleEvaOneProgress={() => {}}
        toggleEvaTwoProgress={() => {}}
        activeFiltersCount={
          (searchQuery ? 1 : 0) +
          (statusFilters[selectedView as "request" | "report" | "reassign"]
            ?.length || 0)
        }
        statusFilterOptions={{
          request: ["Pending", "Approved", "Rejected"],
          report: ["Open", "Resolved", "Ignored"],
          reassign: ["Pending", "Approved", "Rejected"],
        }}
        selectedStatusFilters={
          statusFilters[selectedView as "request" | "report" | "reassign"]
        }
        setSelectedStatusFilters={(statuses: string[]) =>
          setStatusFilters((prev) => ({
            ...prev,
            [selectedView as "request" | "report" | "reassign"]: statuses,
          }))
        }
        evaluatorViewData={requestData}
        restaurantViewData={reportData}
        clearFilters={() => {
          setSearchQuery("");
          setStatusFilters((prev) => ({
            ...prev,
            [selectedView as "request" | "report" | "reassign"]: [],
          }));
        }}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={setRowsPerPage}
      />
      <AdminTable
        type="assignment"
        selectedView={selectedView}
        isLoading={isLoading}
        columns={
          selectedView === "request"
            ? requestColumns
            : selectedView === "report"
              ? reportColumns
              : reassignColumns
        }
        requestViewData={requestViewData}
        reportViewData={reportViewData}
        evaluatorViewData={reassignViewData}
        evaluators={[]}
        establishments={[]}
        assignments={[]}
        setEditingRestaurant={() => {}}
        setEditEvaluator1={() => {}}
        setEditEvaluator2={() => {}}
        setIsEditModalOpen={() => {}}
        handleViewDetails={handleViewDetails}
        handleEdit={handleResolve}
        handleSendNDAEmail={() => {}}
        handleSendNDAReminder={() => {}}
        handleSendCompletionReminder={() => {}}
        renderCell={renderFeedbackCell}
        emptyMessages={{
          request: {
            title: "No Requests Found",
            description: "There are no restaurant requests at the moment.",
          },
          report: {
            title: "No Reports Found",
            description: "There are no issue reports at the moment.",
          },
        }}
      />
      <div className="flex justify-center items-center mt-4">
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

      <AdminModal
        type="restaurant"
        isOpen={isRestaurantModalOpen}
        onClose={() => {
          setIsRestaurantModalOpen(false);
          setSelectedRequest(null);
        }}
        entity={
          selectedRequest
            ? {
                name: selectedRequest.restaurant_name || "",
                category: selectedRequest.category || "",
                address: selectedRequest.address || "",
                remarks: selectedRequest.notes || "",
              }
            : undefined
        }
        mode="edit"
        onSave={handleSaveRestaurant}
        isLoading={actionLoading}
      />

      <AdminModal
        type="assignment"
        subtype="edit"
        isOpen={isReassignModalOpen}
        onClose={() => {
          setIsReassignModalOpen(false);
          setEditingRestaurant(null);
          setEditEvaluator1("");
          setEditEvaluator2("");
          setSelectedReassign(null);
        }}
        singleEvaluatorMode={true}
        allowRestaurantSelection={true}
        editingRestaurant={editingRestaurant}
        setEditingRestaurant={setEditingRestaurant}
        editEvaluator1={editEvaluator1}
        setEditEvaluator1={setEditEvaluator1}
        editEvaluator2={editEvaluator2}
        setEditEvaluator2={setEditEvaluator2}
        evaluators={evaluators}
        assignments={assignments}
        establishments={establishments}
        isLoading={actionLoading}
        setIsLoading={setActionLoading}
        fetchData={fetchData}
        handleSaveEdit={handleReassignSave}
      />

      {/* Disini nanti bisa ditambahkan Modal Details/Resolve */}
    </div>
  );
}
