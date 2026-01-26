"use client";

import AdminHeader from "@/components/admin/AdminHeader";
import AdminTable from "@/components/admin/AdminTable";
import AdminViewControl from "@/components/admin/AdminViewControl";
import { Pagination } from "@nextui-org/react";
import { useEffect, useMemo, useState, type Key, type ReactNode } from "react";
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

// --- DUMMY DATA (Untuk Tampilan UI) ---

const mockRequests = [
  {
    id: "REQ-001",
    date: "2023-10-25",
    evaluator_id: "JEVA-301",
    assign_id: "ASSIGN-1001",
    submitter_name: "John Doe",
    restaurant_name: "Kopi Kenangan Senopati",
    category: "Coffee Shop",
    address: "Jl. Senopati No. 10",
    notes: "Prefers quiet ambiance",
    status: "Pending",
  },
  {
    id: "REQ-002",
    date: "2023-10-24",
    evaluator_id: "JEVA-304",
    assign_id: "ASSIGN-1002",
    submitter_name: "Jane Smith",
    restaurant_name: "Sate Khas Senayan",
    category: "Indonesian",
    address: "Mall Grand Indonesia",
    notes: "Family-friendly request",
    status: "Approved",
  },
  {
    id: "REQ-003",
    date: "2023-10-28",
    evaluator_id: "JEVA-310",
    assign_id: "ASSIGN-1003",
    submitter_name: "Ahmad Rizki",
    restaurant_name: "Bebek Goreng Pak Ndut",
    category: "Indonesian",
    address: "Jl. Raya Bogor No. 45",
    notes: "Needs weekend slot",
    status: "Pending",
  },
  {
    id: "REQ-004",
    date: "2023-10-30",
    evaluator_id: "JEVA-298",
    assign_id: "ASSIGN-1004",
    submitter_name: "Siti Nurhaliza",
    restaurant_name: "Warung Padang Sederhana",
    category: "Padang",
    address: "Jl. Sudirman No. 120",
    notes: "Halal menu focus",
    status: "Rejected",
  },
  {
    id: "REQ-005",
    date: "2023-11-01",
    evaluator_id: "JEVA-325",
    assign_id: "ASSIGN-1005",
    submitter_name: "Budi Santoso",
    restaurant_name: "Pizza Hut Kemang",
    category: "Western",
    address: "Jl. Kemang Raya No. 8",
    notes: "Requested late afternoon",
    status: "Approved",
  },
];

const mockReports = [
  {
    id: "RPT-991",
    date: "2023-10-26",
    evaluator_id: "JEVA-203",
    assign_id: "ASSIGN-1023",
    reporter_name: "Michael B",
    issue_type: "Restaurant Closed",
    description: "Tempatnya sudah berganti jadi toko baju.",
    status: "Open",
  },
  {
    id: "RPT-992",
    date: "2023-10-20",
    evaluator_id: "JEVA-177",
    assign_id: "ASSIGN-1100",
    reporter_name: "Sarah C",
    issue_type: "Food Poisoning",
    description: "Saya merasa mual 2 jam setelah makan.",
    status: "Resolved",
  },
  {
    id: "RPT-993",
    date: "2023-11-02",
    evaluator_id: "JEVA-189",
    assign_id: "ASSIGN-1154",
    reporter_name: "Andi K",
    issue_type: "Bad Service",
    description: "Staff tidak responsif selama visitasi.",
    status: "Open",
  },
  {
    id: "RPT-994",
    date: "2023-11-05",
    evaluator_id: "JEVA-203",
    assign_id: "ASSIGN-1201",
    reporter_name: "Lia P",
    issue_type: "Restaurant Closed",
    description: "Restoran tutup permanen sesuai info tetangga.",
    status: "Ignored",
  },
];

const mockReassignRequests = [
  {
    id: "RR-101",
    date: "2023-11-10",
    evaluator_id: "JEVA-203",
    assign_id: "ASSIGN-1201",
    evaluator_name: "Lia P",
    restaurant_name: "Warung Padang Sederhana",
    reason: "Evaluator unavailable for revisit",
  },
  {
    id: "RR-102",
    date: "2023-11-12",
    evaluator_id: "JEVA-177",
    assign_id: "ASSIGN-1154",
    evaluator_name: "Andi K",
    restaurant_name: "Pizza Hut Kemang",
    reason: "Restaurant rescheduled",
  },
  {
    id: "RR-103",
    date: "2023-11-15",
    evaluator_id: "JEVA-189",
    assign_id: "ASSIGN-1100",
    evaluator_name: "Sarah C",
    restaurant_name: "Sate Khas Senayan",
    reason: "Conflict with assigned schedule",
  },
];

export default function FeedbackPage() {
  // State
  const [selectedView, setSelectedView] = useState<string>("request"); // 'request' | 'report' | 'reassign'
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  // Dummy loading state
  const [isLoading, setIsLoading] = useState(false);

  // --- FILTER LOGIC (Sederhana untuk Mock Data) ---

  const filteredData = useMemo(() => {
    // 1. Pilih data source berdasarkan tab
    let data: Record<string, unknown>[] =
      selectedView === "request"
        ? mockRequests
        : selectedView === "report"
          ? mockReports
          : mockReassignRequests;

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
  }, [selectedView, searchQuery]);
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
        evaluatorViewData={mockRequests}
        restaurantViewData={mockReports}
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
