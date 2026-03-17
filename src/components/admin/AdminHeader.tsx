import { Button } from "@nextui-org/react";
import { useState } from "react";
import { MdOpenInNew, MdSync } from "react-icons/md";
import Swal from "sweetalert2";

const SPREADSHEET_URL = process.env.NEXT_PUBLIC_SPREADSHEET_URL;

interface AdminHeaderProps {
  type: "assignment" | "evaluator" | "restaurant" | "budget";
  title?: string;
  subtitle?: string;
  // Data props for sync functionality
  assignments?: any[];
  evaluators?: any[];
  establishments?: any[];
  userName?: string;
}

export default function AdminHeader({
  type,
  title: initialTitle,
  subtitle,
  assignments,
  evaluators,
  establishments,
  userName = "Admin",
}: AdminHeaderProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
  });

  // If title is passed via props, use it. Otherwise, use defaults.
  // For 'assignment', default to greeting.
  const displayTitle = initialTitle
    ? initialTitle
    : type === "assignment"
      ? `Hello, ${userName}`
      : type === "evaluator"
        ? "Manage Evaluators"
        : type === "restaurant"
          ? "Manage Restaurants"
          : "Budget Analytics";

  const handleSyncToSpreadsheet = async () => {
    // Check which payload fields are missing and provide informative error
    const missingData: string[] = [];
    if (!Array.isArray(evaluators)) missingData.push("Evaluators");
    if (!Array.isArray(establishments)) missingData.push("Establishments");
    if (!Array.isArray(assignments)) missingData.push("Assignments");

    if (missingData.length > 0) {
      await Swal.fire({
        icon: "warning",
        title: "Data not ready",
        html: `
          <div class="text-left">
            <p class="mb-2">Sync cannot run because the following data is not available:</p>
            <ul class="list-disc list-inside text-gray-600">
              ${missingData.map((item) => `<li>${item}</li>`).join("")}
            </ul>
            <p class="mt-3 text-sm text-gray-500">
              Please reload the data first.
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

      const contentType = response.headers.get("content-type") || "";
      const result = contentType.includes("application/json")
        ? await response.json()
        : { error: await response.text() };

      if (response.ok) {
        const counts = result?.counts || {};
        await toast.fire({
          icon: "success",
          title: "Data synced to Spreadsheet.",
          html: `
            <div class="text-sm text-left">
              Evaluators: <strong>${counts.evaluators ?? 0}</strong>, Restaurants: <strong>${counts.establishments ?? 0}</strong>, Budget: <strong>${counts.budgetEntries ?? 0}</strong>
            </div>
          `,
        });
      } else {
        console.error("Sync server error:", result?.error || result);
        await Swal.fire({
          icon: "error",
          title: "Sync failed",
          text: "There was an issue sending data to Spreadsheet. Please try again. If it still fails, contact the technical team.",
          confirmButtonColor: "#A67C37",
        });
      }
    } catch (error: unknown) {
      console.error("Sync error:", error);
      await Swal.fire({
        icon: "error",
        title: "Sync failed",
        text: "There was an issue sending data to Spreadsheet. Please try again. If it still fails, contact the technical team.",
        confirmButtonColor: "#A67C37",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const openSpreadsheet = () => {
    if (!SPREADSHEET_URL) {
      Swal.fire({
        icon: "error",
        title: "Configuration incomplete",
        text: "Spreadsheet link is not configured. Ask the technical team to set NEXT_PUBLIC_SPREADSHEET_URL.",
        confirmButtonColor: "#A67C37",
      });
      return;
    }

    const popup = window.open(SPREADSHEET_URL, "_blank", "noopener,noreferrer");

    if (!popup) {
      Swal.fire({
        icon: "info",
        title: "Unable to open Spreadsheet",
        text: "Your browser blocked a new tab. Please allow pop-ups for this site, then click Open Spreadsheet again.",
        confirmButtonText: "Got it",
        confirmButtonColor: "#A67C37",
      });
      return;
    }

    popup.opener = null;
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
            <h2 className="text-xl sm:text-2xl font-bold">
              {displayTitle || "Budget Management"}
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
          <h2 className="text-xl sm:text-2xl font-bold">
            {displayTitle || "Assignment Management"}
          </h2>
          {renderSyncButtons()}
        </div>
      );
    case "evaluator":
      return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <h2 className="text-xl sm:text-2xl font-bold">
            {displayTitle || "Evaluator Management"}
          </h2>
          {renderSyncButtons()}
        </div>
      );
    case "restaurant":
      return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <h2 className="text-xl sm:text-2xl font-bold">
            {displayTitle || "Restaurant Management"}
          </h2>
          {renderSyncButtons()}
        </div>
      );
    default:
      return null;
  }
}
