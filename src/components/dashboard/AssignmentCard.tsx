import { EvaluatorAssignment } from "@/lib/assignmentService";

interface AssignmentCardProps {
  assignment: EvaluatorAssignment;
  onSubmit: (a: EvaluatorAssignment) => void;
  onClaim: (a: EvaluatorAssignment) => void;
  onReassign: (a: EvaluatorAssignment) => void;
  onReport: (a: EvaluatorAssignment) => void;
}

export default function AssignmentCard({
  assignment,
  onSubmit,
  onClaim,
  onReassign,
  onReport,
}: AssignmentCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "reported":
        return "bg-red-500";
      case "reassigned":
        return "bg-purple-500";
      case "completed":
        return "bg-green-500";
      case "submitted":
        return "bg-blue-500";
      default:
        return "bg-[#FFA200]";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "reported":
        return "bg-red-100 text-red-700";
      case "reassigned":
        return "bg-purple-100 text-purple-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "submitted":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-orange-100 text-orange-700";
    }
  };

  const getCardBackground = (status: string) => {
    switch (status) {
      case "reported":
        return "bg-red-50 border-red-100";
      case "reassigned":
        return "bg-purple-50 border-purple-100";
      default:
        return "bg-white border-gray-100";
    }
  };

  const isDisabled =
    assignment.status === "completed" ||
    assignment.status === "reported" ||
    assignment.status === "reassigned";

  return (
    <div
      className={`rounded-2xl p-5 shadow-sm border hover:shadow-md transition-shadow relative overflow-hidden ${getCardBackground(
        assignment.status,
      )}`}
    >
      {/* Status Stripe */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${getStatusColor(
          assignment.status,
        )}`}
      ></div>

      <div className="flex justify-between items-start mb-3 pl-2">
        <div>
          <span className="inline-block px-2 py-1 rounded-md bg-gray-100 text-xs font-semibold text-gray-600 mb-2">
            {assignment.establishment.category}
          </span>
          <h4 className="text-lg font-bold text-gray-900 leading-tight">
            {assignment.establishment.name}
          </h4>
          <p className="text-xs text-gray-400 mt-1">
            ID:{" "}
            <span className="font-mono text-xs text-gray-500 break-words">
              {assignment.id}
            </span>
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${getStatusBadge(
            assignment.status,
          )}`}
        >
          {assignment.status === "reassigned"
            ? "Reassign Requested"
            : assignment.status}{" "}
        </span>
      </div>

      <div className="pl-2 mb-4">
        <p className="text-sm text-gray-500 flex items-center gap-1 mb-1">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {assignment.establishment.address || "No address provided"}
        </p>
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Assigned: {formatDate(assignment.assignedAt)}
        </p>
      </div>

      <div className="pl-2 space-y-3">
        <button
          onClick={() => {
            if (assignment.status === "pending") onSubmit(assignment);
            if (assignment.status === "submitted") onClaim(assignment);
          }}
          disabled={isDisabled}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
            isDisabled
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : assignment.status === "submitted"
                ? "bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-orange-100"
                : "bg-[#1B1B1B] text-white hover:bg-black shadow-lg shadow-gray-200"
          }`}
        >
          {assignment.status === "completed"
            ? "Completed"
            : assignment.status === "reported"
              ? "Reported"
              : assignment.status === "reassigned"
                ? "Reassigned"
                : assignment.status === "submitted"
                  ? "Claim Submission"
                  : "Submit Form"}
          <div
            className={
              assignment.status === "completed"
                ? "hidden"
                : "transform transition-transform group-hover:translate-x-1"
            }
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </div>
        </button>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onReassign(assignment)}
            disabled={assignment.status !== "pending"}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold border transition-all ${
              assignment.status !== "pending"
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h11l-1.5-1.5M3 14h11l-1.5 1.5M14 6h7v12h-7"
              />
            </svg>
            Reassign
          </button>
          <button
            onClick={() => onReport(assignment)}
            disabled={assignment.status !== "pending"}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold border transition-all ${
              assignment.status !== "pending"
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                : "border border-red-200 text-red-600 bg-red-50 hover:bg-red-100"
            }`}
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Report
          </button>
        </div>
      </div>
    </div>
  );
}
