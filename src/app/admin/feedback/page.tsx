"use client";

import AdminHeader from "@/components/admin/AdminHeader";
import AdminTable from "@/components/admin/AdminTable";
import AdminViewControl from "@/components/admin/AdminViewControl";
import { Pagination } from "@nextui-org/react";
import { useEffect, useMemo, useState } from "react";
import { MdAssignment, MdReportProblem } from "react-icons/md";

// --- COLUMN DEFINITIONS ---

// Kolom untuk Tab "Requests" (Rekomendasi Tempat Baru)
export const requestColumns = [
  { name: "ID", uid: "id" },
  { name: "Submitter", uid: "submitter_name" },
  { name: "Restaurant Name", uid: "restaurant_name" },
  { name: "Category", uid: "category" },
  { name: "Address", uid: "address" },
  { name: "Date Submitted", uid: "date_submitted" },
  { name: "Status", uid: "status" }, // Pending, Approved, Rejected
  { name: "Actions", uid: "actions" },
];

// Kolom untuk Tab "Reports" (Laporan Masalah)
export const reportColumns = [
  { name: "ID", uid: "id" },
  { name: "Reporter", uid: "reporter_name" },
  { name: "Assignment Ref", uid: "assignment_ref" }, // ID Assignment terkait
  { name: "Issue Type", uid: "issue_type" }, // Closed, Food Poisoning, etc
  { name: "Description", uid: "description" },
  { name: "Date Reported", uid: "date_reported" },
  { name: "Status", uid: "status" }, // Open, Resolved, Ignored
  { name: "Actions", uid: "actions" },
];

// --- DUMMY DATA (Untuk Tampilan UI) ---

const mockRequests = [
  {
    id: "REQ-001",
    submitter_name: "John Doe",
    restaurant_name: "Kopi Kenangan Senopati",
    category: "Coffee Shop",
    address: "Jl. Senopati No. 10",
    date_submitted: "2023-10-25",
    status: "Pending",
  },
  {
    id: "REQ-002",
    submitter_name: "Jane Smith",
    restaurant_name: "Sate Khas Senayan",
    category: "Indonesian",
    address: "Mall Grand Indonesia",
    date_submitted: "2023-10-24",
    status: "Approved",
  },
  {
    id: "REQ-003",
    submitter_name: "Ahmad Rizki",
    restaurant_name: "Bebek Goreng Pak Ndut",
    category: "Indonesian",
    address: "Jl. Raya Bogor No. 45",
    date_submitted: "2023-10-28",
    status: "Pending",
  },
  {
    id: "REQ-004",
    submitter_name: "Siti Nurhaliza",
    restaurant_name: "Warung Padang Sederhana",
    category: "Padang",
    address: "Jl. Sudirman No. 120",
    date_submitted: "2023-10-30",
    status: "Rejected",
  },
  {
    id: "REQ-005",
    submitter_name: "Budi Santoso",
    restaurant_name: "Pizza Hut Kemang",
    category: "Western",
    address: "Jl. Kemang Raya No. 8",
    date_submitted: "2023-11-01",
    status: "Approved",
  },
];

const mockReports = [
  {
    id: "RPT-991",
    reporter_name: "Michael B",
    assignment_ref: "ASSIGN-1023",
    issue_type: "Restaurant Closed",
    description: "Tempatnya sudah berganti jadi toko baju.",
    date_reported: "2023-10-26",
    status: "Open",
  },
  {
    id: "RPT-992",
    reporter_name: "Sarah C",
    assignment_ref: "ASSIGN-1100",
    issue_type: "Food Poisoning",
    description: "Saya merasa mual 2 jam setelah makan.",
    date_reported: "2023-10-20",
    status: "Resolved",
  },
  {
    id: "RPT-993",
    reporter_name: "Andi K",
    assignment_ref: "ASSIGN-1154",
    issue_type: "Bad Service",
    description: "Staff tidak responsif selama visitasi.",
    date_reported: "2023-11-02",
    status: "Open",
  },
  {
    id: "RPT-994",
    reporter_name: "Lia P",
    assignment_ref: "ASSIGN-1201",
    issue_type: "Restaurant Closed",
    description: "Restoran tutup permanen sesuai info tetangga.",
    date_reported: "2023-11-05",
    status: "Ignored",
  },
];

export default function FeedbackPage() {
  // State
  const [selectedView, setSelectedView] = useState<string>("request"); // 'request' or 'report'
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  // Dummy loading state
  const [isLoading, setIsLoading] = useState(false);

  // --- FILTER LOGIC (Sederhana untuk Mock Data) ---

  const filteredData = useMemo(() => {
    // 1. Pilih data source berdasarkan tab
    let data: Record<string, unknown>[] =
      selectedView === "request" ? mockRequests : mockReports;

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
            label: "Request",
            shortLabel: "Request",
            icon: (
              <MdAssignment
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
        ]}
        searchPlaceholders={{
          request: "Search by submitter, restaurant, category, or status...",
          report: "Search by reporter, assignment, issue type, or status...",
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
        columns={selectedView === "request" ? requestColumns : reportColumns}
        requestViewData={requestViewData}
        reportViewData={reportViewData}
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
