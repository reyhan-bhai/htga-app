"use client";

import AdminHeader from "@/components/admin/AdminHeader";
import AdminTable from "@/components/admin/AdminTable";
import AdminViewControl from "@/components/admin/AdminViewControl";
import { db } from "@/lib/firebase";
import { Pagination } from "@nextui-org/react";
import { useEffect, useMemo, useState, type Key, type ReactNode } from "react";
import { onValue, ref } from "firebase/database";
import {
  MdAssignment,
  MdReportProblem,
  MdRestaurantMenu,
} from "react-icons/md";

// --- COLUMN DEFINITIONS ---

// Kolom untuk Tab "Requests" (Rekomendasi Tempat Baru)
export const requestColumns = [
  { name: "ID", uid: "id" },
  { name: "Date", uid: "date" },
  { name: "Evaluator ID", uid: "evaluator_id" },
  { name: "Submitter", uid: "submitter_name" },
  { name: "Restaurant Name", uid: "restaurant_name" },
  { name: "Category", uid: "category" },
  { name: "Address", uid: "address" },
  { name: "Notes", uid: "notes" },
  { name: "Status", uid: "status" }, // Pending, Approved, Rejected
  { name: "Actions", uid: "actions" },
];

// Kolom untuk Tab "Reports" (Laporan Masalah)
export const reportColumns = [
  { name: "ID", uid: "id" },
  { name: "Date", uid: "date" },
  { name: "Evaluator ID", uid: "evaluator_id" },
  { name: "Assign ID", uid: "assign_id" },
  { name: "Reporter", uid: "reporter_name" },
  { name: "Issue Type", uid: "issue_type" }, // Closed, Food Poisoning, etc
  { name: "Description", uid: "description" },
  { name: "Status", uid: "status" }, // Open, Resolved, Ignored
  { name: "Actions", uid: "actions" },
];

// Kolom untuk Tab "Re-assign Request"
export const reassignColumns = [
  { name: "ID", uid: "id" },
  { name: "Date", uid: "date" },
  { name: "Evaluator ID", uid: "evaluator_id" },
  { name: "Assign ID", uid: "assign_id" },
  { name: "Evaluator Name", uid: "evaluator_name" },
  { name: "Restaurant Name", uid: "restaurant_name" },
  { name: "Reason", uid: "reason" },
  { name: "Actions", uid: "actions" },
];

export default function FeedbackPage() {
  // State
  const [selectedView, setSelectedView] = useState<string>("request"); // 'request' | 'report' | 'reassign'
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [requestData, setRequestData] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [reassignData, setReassignData] = useState<any[]>([]);

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

    // 3. (Optional) Filter Status jika nanti diimplementasikan
    // if (selectedStatus.length > 0) ...

    return data;
  }, [selectedView, searchQuery, requestData, reportData, reassignData]);
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

  const renderFeedbackCell = (item: any, columnKey: Key): ReactNode => {
    const cellValue = item[columnKey as keyof typeof item];

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
      <AdminHeader
        type="assignment"
        showAssignmentActions={false}
        assignments={[]}
        establishments={[]}
        setIsLoading={setIsLoading}
        fetchData={async () => {}} // Return a Promise<void>
        setIsManualMatchOpen={() => {}}
      />
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
        activeFiltersCount={searchQuery ? 1 : 0}
  evaluatorViewData={requestData}
  restaurantViewData={reportData}
        clearFilters={() => setSearchQuery("")}
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

      {/* Disini nanti bisa ditambahkan Modal Details/Resolve */}
    </div>
  );
}
