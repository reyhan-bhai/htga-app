import { Button } from "@nextui-org/react";
import { useMemo } from "react";
import { MdRefresh } from "react-icons/md";

interface SuperadminHeaderProps {
  title?: string;
  subtitle?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function SuperadminHeader({
  title = "Admin Accounts",
  subtitle = "Create, update, disable, or remove admin users.",
  onRefresh,
  isRefreshing = false,
}: SuperadminHeaderProps) {
  const refreshDisabled = useMemo(
    () => !onRefresh || isRefreshing,
    [onRefresh, isRefreshing],
  );

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{title}</h2>
        {subtitle ? (
          <p className="text-gray-600 text-sm mt-1">{subtitle}</p>
        ) : null}
      </div>

      {onRefresh ? (
        <Button
          className={`bg-blue-600 text-white font-semibold rounded-lg text-sm ${
            refreshDisabled ? "opacity-70 cursor-not-allowed" : ""
          }`}
          startContent={
            <MdRefresh
              size={18}
              className={isRefreshing ? "animate-spin" : ""}
            />
          }
          onPress={onRefresh}
          isDisabled={refreshDisabled}
          size="sm"
        >
          <span className="hidden sm:inline">
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </span>
          <span className="sm:hidden">{isRefreshing ? "..." : "Sync"}</span>
        </Button>
      ) : null}
    </div>
  );
}
