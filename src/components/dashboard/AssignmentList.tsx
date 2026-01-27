import { EvaluatorAssignment } from "@/lib/assignmentService";
import { useState } from "react";
import AssignmentCard from "./AssignmentCard";

type StatusFilter =
  | "All"
  | "Pending"
  | "Submitted"
  | "Completed"
  | "Reassigned"
  | "Reported";

interface AssignmentListProps {
  assignments: EvaluatorAssignment[];
  loading: boolean;
  onSubmit: (a: EvaluatorAssignment) => void;
  onClaim: (a: EvaluatorAssignment) => void;
  onReassign: (a: EvaluatorAssignment) => void;
  onReport: (a: EvaluatorAssignment) => void;
}

export default function AssignmentList({
  assignments,
  loading,
  onSubmit,
  onClaim,
  onReassign,
  onReport,
}: AssignmentListProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("All");

  const categoryOptions = [
    "All",
    ...Array.from(
      new Set(
        assignments
          .map((assignment) => assignment.establishment.category)
          .filter((category) => category && category.trim().length > 0),
      ),
    ),
  ];

  const filteredAssignments = assignments.filter((assignment) => {
    if (
      selectedStatus !== "All" &&
      assignment.status !== selectedStatus.toLowerCase()
    ) {
      return false;
    }
    if (selectedCategory === "All") return true;
    return (
      assignment.establishment.category?.toLowerCase() ===
      selectedCategory.toLowerCase()
    );
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900 mb-2">Your Assignments</h3>

      {/* Filters */}
      <div className="mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label
                htmlFor="status-filter"
                className="text-xs font-semibold uppercase tracking-wide text-gray-400"
              >
                Status
              </label>
              <div className="mt-2 relative">
                <select
                  id="status-filter"
                  value={selectedStatus}
                  onChange={(event) =>
                    setSelectedStatus(event.target.value as StatusFilter)
                  }
                  className="w-full appearance-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 shadow-[0_8px_20px_rgba(15,23,42,0.06)] transition focus:border-[#1B1B1B] focus:outline-none focus:ring-4 focus:ring-[#1B1B1B]/10"
                >
                  {(
                    [
                      "All",
                      "Pending",
                      "Submitted",
                      "Completed",
                      "Reassigned",
                      "Reported",
                    ] as StatusFilter[]
                  ).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                  ▾
                </span>
              </div>
            </div>

            <div className="flex-1">
              <label
                htmlFor="category-filter"
                className="text-xs font-semibold uppercase tracking-wide text-gray-400"
              >
                Specialty
              </label>
              <div className="mt-2 relative">
                <select
                  id="category-filter"
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                  className="w-full appearance-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 shadow-[0_8px_20px_rgba(15,23,42,0.06)] transition focus:border-[#FFA200] focus:outline-none focus:ring-4 focus:ring-[#FFA200]/20"
                >
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                  ▾
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFA200]"></div>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-300">
          <p className="text-gray-500">No assignments found.</p>
        </div>
      ) : (
        filteredAssignments.map((assignment) => (
          <AssignmentCard
            key={assignment.id}
            assignment={assignment}
            onSubmit={onSubmit}
            onClaim={onClaim}
            onReassign={onReassign}
            onReport={onReport}
          />
        ))
      )}
    </div>
  );
}
