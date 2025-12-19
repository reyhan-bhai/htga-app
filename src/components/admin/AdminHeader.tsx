import {
  handleManualMatch,
  handleMatchEvaluator,
} from "@/lib/assignedPageUtils";
import { Button } from "@nextui-org/react";
import { MdLink, MdShuffle } from "react-icons/md";

interface AdminHeaderProps {
  type: "assignment" | "evaluator" | "restaurant";
  // Assignment specific props
  assignments?: any[];
  establishments?: any[];
  setIsLoading?: (loading: boolean) => void;
  fetchData?: () => Promise<void>;
  setIsManualMatchOpen?: (open: boolean) => void;
}

export default function AdminHeader({
  type,
  assignments,
  establishments,
  setIsLoading,
  fetchData,
  setIsManualMatchOpen,
}: AdminHeaderProps) {
  switch (type) {
    case "assignment":
      return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <h2 className="text-xl sm:text-2xl font-bold uppercase">
            Assignment Management
          </h2>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Button
              className="bg-[#A67C37] text-white font-semibold rounded-lg text-sm sm:text-base"
              startContent={<MdShuffle size={18} />}
              onPress={() =>
                handleMatchEvaluator(
                  setIsLoading!,
                  assignments!,
                  establishments!,
                  fetchData!
                )
              }
              size="sm"
            >
              <span className="hidden sm:inline">Match Evaluator</span>
              <span className="sm:hidden">Match</span>
            </Button>
            <Button
              className="bg-white border-2 border-[#A67C37] text-[#A67C37] font-semibold rounded-lg text-sm sm:text-base"
              startContent={<MdLink size={18} />}
              onPress={() => handleManualMatch(setIsManualMatchOpen!)}
              size="sm"
            >
              <span className="hidden sm:inline">Manual Match</span>
              <span className="sm:hidden">Manual</span>
            </Button>
          </div>
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
