import { Button } from "@nextui-org/react";
import { useState } from "react";
import { MdOpenInNew, MdSync } from "react-icons/md";

const SPREADSHEET_URL =
  "https://docs.google.com/spreadsheets/d/1THH_mVOFUAorNjVtGm37KJyBpE-ttsN5Z2Xa75O5YD0/edit";

interface AdminHeaderProps {
  type: "assignment" | "evaluator" | "restaurant" | "budget";
  title?: string;
  subtitle?: string;
  // Assignment specific props
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
    if (!evaluators || !establishments || !assignments) {
      alert("Data not available for sync");
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
        alert(
          `✅ Data synced successfully!\n\nSynced:\n• ${result.counts.evaluators} evaluators\n• ${result.counts.establishments} establishments\n• ${result.counts.budgetEntries} budget entries`,
        );
      } else {
        alert(`❌ Sync failed: ${result.error}`);
      }
    } catch (error: any) {
      console.error("Sync error:", error);
      alert(`❌ Sync failed: ${error.message}`);
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
        className="bg-green-600 text-white font-semibold rounded-lg text-sm"
        startContent={
          <MdSync size={18} className={isSyncing ? "animate-spin" : ""} />
        }
        onPress={handleSyncToSpreadsheet}
        isLoading={isSyncing}
        size="sm"
      >
        <span className="hidden sm:inline">
          {isSyncing ? "Syncing..." : "Sync to Spreadsheet"}
        </span>
        <span className="sm:hidden">{isSyncing ? "..." : "Sync"}</span>
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
        </div>
      );
    case "restaurant":
      return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <h2 className="text-xl sm:text-2xl font-bold uppercase">
            Restaurant Management
          </h2>
        </div>
      );
    default:
      return null;
  }
}
