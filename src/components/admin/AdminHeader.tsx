import { Button } from "@nextui-org/react";
import { useState } from "react";
import { MdOpenInNew, MdSync } from "react-icons/md";
import Swal from "sweetalert2";

const SPREADSHEET_URL =
  "https://docs.google.com/spreadsheets/d/1THH_mVOFUAorNjVtGm37KJyBpE-ttsN5Z2Xa75O5YD0/edit";

interface AdminHeaderProps {
  type: "assignment" | "evaluator" | "restaurant" | "budget";
  title?: string;
  subtitle?: string;
  // Data props for sync functionality
  assignments?: any[];
  evaluators?: any[];
  establishments?: any[];
}

export default function AdminHeader({
  type,
  title,
  subtitle,
  assignments,
  evaluators,
  establishments,
}: AdminHeaderProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncToSpreadsheet = async () => {
    // Check which data is missing and provide informative error
    const missingData: string[] = [];
    if (!evaluators || evaluators.length === 0) missingData.push("Evaluators");
    if (!establishments || establishments.length === 0)
      missingData.push("Establishments");
    if (!assignments || assignments.length === 0)
      missingData.push("Assignments");

    if (missingData.length > 0) {
      await Swal.fire({
        icon: "warning",
        title: "Data Not Available",
        html: `
          <div class="text-left">
            <p class="mb-2">The following data is missing or empty:</p>
            <ul class="list-disc list-inside text-gray-600">
              ${missingData.map((item) => `<li>${item}</li>`).join("")}
            </ul>
            <p class="mt-3 text-sm text-gray-500">
              Please ensure the data is loaded before syncing to the spreadsheet.
            </p>
          </div>
        `,
        confirmButtonColor: "#A67C37",
      });
      return;
    }

    setIsSyncing(true);
    try {
      const response = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evaluators,
          establishments,
          assignments,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        await Swal.fire({
          icon: "success",
          title: "Sync Successful!",
          html: `
            <div class="text-left">
              <p class="mb-2">Data has been synced to the spreadsheet:</p>
              <ul class="list-disc list-inside text-gray-600">
                <li><strong>${result.counts.evaluators}</strong> evaluators</li>
                <li><strong>${result.counts.establishments}</strong> establishments</li>
                <li><strong>${result.counts.budgetEntries}</strong> budget entries</li>
              </ul>
            </div>
          `,
          confirmButtonColor: "#A67C37",
        });
      } else {
        await Swal.fire({
          icon: "error",
          title: "Sync Failed",
          text: result.error || "An error occurred while syncing data.",
          confirmButtonColor: "#A67C37",
        });
      }
    } catch (error: any) {
      console.error("Sync error:", error);
      await Swal.fire({
        icon: "error",
        title: "Sync Failed",
        html: `
          <div class="text-left">
            <p class="mb-2">An error occurred while syncing:</p>
            <p class="text-red-600 text-sm">${error.message || "Unknown error"}</p>
          </div>
        `,
        confirmButtonColor: "#A67C37",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const openSpreadsheet = () => {
    window.open(SPREADSHEET_URL, "_blank");
  };

  const renderSyncButtons = () => (
    <div className="flex gap-2">
      <Button
        className={`bg-green-600 text-white font-semibold rounded-lg text-sm ${
          isSyncing ? "opacity-70 cursor-not-allowed" : ""
        }`}
        startContent={
          <MdSync size={18} className={isSyncing ? "animate-spin" : ""} />
        }
        onPress={handleSyncToSpreadsheet}
        isDisabled={isSyncing}
        size="sm"
      >
        <span className="hidden sm:inline">
          {isSyncing ? "Syncing..." : "Sync to Spreadsheet"}
        </span>
        {/* <span className="sm:hidden">{isSyncing ? "..." : "Sync"}</span> */}
      </Button>
      <Button
        className="bg-blue-600 text-white font-semibold rounded-lg text-sm"
        startContent={<MdOpenInNew size={18} />}
        onPress={openSpreadsheet}
        size="sm"
      >
        <span className="hidden sm:inline">Open Spreadsheet</span>
        <span className="sm:hidden">Sheet</span>
      </Button>
    </div>
  );

  switch (type) {
    case "budget":
      return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold uppercase">
              {title || "Budget Management"}
            </h2>
            {subtitle && (
              <p className="text-gray-600 text-sm mt-1">{subtitle}</p>
            )}
          </div>
          {renderSyncButtons()}
        </div>
      );

    case "assignment":
      return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <h2 className="text-xl sm:text-2xl font-bold uppercase">
            Assignment Management
          </h2>
          {renderSyncButtons()}
        </div>
      );
    case "evaluator":
      return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <h2 className="text-xl sm:text-2xl font-bold uppercase">
            Evaluator Management
          </h2>
          {renderSyncButtons()}
        </div>
      );
    case "restaurant":
      return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <h2 className="text-xl sm:text-2xl font-bold uppercase">
            Restaurant Management
          </h2>
          {renderSyncButtons()}
        </div>
      );
    default:
      return null;
  }
}
