import { EvaluatorAssignment } from "@/lib/assignmentService";

export default function ProgressStats({
  assignments,
}: {
  assignments: EvaluatorAssignment[];
}) {
  const submittedCount = assignments.filter(
    (a) => a.status === "submitted" || a.status === "completed",
  ).length;
  const claimedCount = assignments.filter(
    (a) => a.status === "completed",
  ).length;
  const totalCount = assignments.length;
  const submittedProgress =
    totalCount > 0 ? (submittedCount / totalCount) * 100 : 0;
  const claimedProgress =
    totalCount > 0 ? (claimedCount / totalCount) * 100 : 0;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
      <h3 className="text-gray-900 text-lg font-bold mb-6">
        Evaluation Progress
      </h3>
      <div className="space-y-6">
        {/* Submitted Bar */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50">
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>{" "}
              </div>
              <span className="text-sm font-semibold text-gray-700">
                Forms Submitted
              </span>
            </div>
            <span className="text-sm font-bold text-blue-600">
              {submittedCount}/{totalCount}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${submittedProgress}%` }}
            ></div>
          </div>
        </div>
        {/* Claimed Bar */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-green-50">
                {/* ... (Green Icon) ... */}
                <svg
                  className="w-4 h-4 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>{" "}
              </div>
              <span className="text-sm font-semibold text-gray-700">
                Claims Processed
              </span>
            </div>
            <span className="text-sm font-bold text-green-600">
              {claimedCount}/{totalCount}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-green-600 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${claimedProgress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
