import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
} from "@nextui-org/react";
import React from "react";
import { MdDelete, MdEdit, MdInfoOutline } from "react-icons/md";

interface TableComponentProps {
  columns: { name: string; uid: string }[];
  data: any[];
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  onView?: (item: any) => void;
  renderCell?: (item: any, columnKey: React.Key) => React.ReactNode;
  emptyMessage?: {
    title: string;
    description: string;
  };
  hideActions?: boolean;
}

export default function TableComponent({
  columns,
  data,
  onEdit,
  onDelete,
  onView,
  renderCell: customRenderCell,
  emptyMessage,
  hideActions = false,
}: TableComponentProps) {
  const defaultRenderCell = React.useCallback(
    (user: any, columnKey: React.Key) => {
      const cellValue = user[columnKey as keyof typeof user];

      switch (columnKey) {
        case "actions":
          if (hideActions) return null;
          return (
            <div className="relative flex items-center justify-center gap-2">
              {onEdit && (
                <Tooltip content="Edit" className="bg-black text-white">
                  <span
                    className="text-lg text-default-400 cursor-pointer active:opacity-50"
                    onClick={() => onEdit(user)}
                  >
                    <MdEdit />
                  </span>
                </Tooltip>
              )}
              {onDelete && (
                <Tooltip color="danger" content="Delete">
                  <span
                    className="text-lg text-default-400 cursor-pointer active:opacity-50"
                    onClick={() => onDelete(user)}
                  >
                    <MdDelete />
                  </span>
                </Tooltip>
              )}
              {onView && (
                <Tooltip content="Details" className="bg-black text-white">
                  <span
                    className="text-lg text-default-400 cursor-pointer active:opacity-50"
                    onClick={() => onView(user)}
                  >
                    <MdInfoOutline />
                  </span>
                </Tooltip>
              )}
            </div>
          );
        case "remarks":
          const trimmedValue = cellValue ? String(cellValue).trim() : "";
          console.log("trimmedValue:", trimmedValue);
          {
            return trimmedValue.length === 0 ? (
              <span className="text-gray-400 italic">No remarks</span>
            ) : (
              <a
                href={trimmedValue}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline hover:text-blue-700"
              >
                Link
              </a>
            );
          }
        case "halalStatus":
          const halalValue = cellValue ? String(cellValue).trim() : "";
          return halalValue.length === 0 ? (
            <span className="text-gray-400 italic">No Halal Status</span>
          ) : (
            halalValue
          );
        case "budget":
          const budgetValue = cellValue ? String(cellValue).trim() : "";
          return budgetValue.length === 0 ? (
            <span className="text-gray-400 italic">No Budget</span>
          ) : (
            budgetValue
          );
        case "rating":
          const ratingValue = cellValue ? String(cellValue).trim() : "";
          return ratingValue.length === 0 ? (
            <span className="text-gray-400 italic">No Rating</span>
          ) : (
            ratingValue
          );
        case "contactInfo":
          const contactValue = cellValue ? String(cellValue).trim() : "";
          return contactValue.length === 0 ? (
            <span className="text-gray-400 italic">No Contact</span>
          ) : (
            contactValue
          );
        default:
          return cellValue;
      }
    },
    [onEdit, onDelete, onView, hideActions]
  );

  const renderCell = React.useCallback(
    (item: any, columnKey: React.Key) => {
      if (customRenderCell) {
        const customResult = customRenderCell(item, columnKey);
        // If custom render returns undefined, fall back to default
        if (customResult !== undefined) {
          return customResult;
        }
      }
      return defaultRenderCell(item, columnKey);
    },
    [customRenderCell, defaultRenderCell]
  );

  return (
    <Table
      aria-label="Evaluator Management Table"
      classNames={{
        wrapper:
          "min-h-[400px] shadow-none border border-gray-200 rounded-lg p-0",
        th: "bg-[#F2BD56] text-black font-bold text-sm !rounded-none",
        td: "text-sm text-gray-700 py-3 font-medium",
      }}
    >
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn
            key={column.uid}
            align={column.uid === "actions" ? "center" : "start"}
            className={
              column.uid === "actions" ? "sticky right-0 z-20 bg-[#F2BD56]" : ""
            }
          >
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody
        items={data}
        emptyContent={
          <div className="text-center py-12 text-gray-500">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <MdInfoOutline size={32} className="text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-1">
                  {emptyMessage?.title || "No data found"}
                </h3>
                <p className="text-sm text-gray-500">
                  {emptyMessage?.description ||
                    "There is no data to display at the moment."}
                </p>
              </div>
            </div>
          </div>
        }
      >
        {(item) => (
          <TableRow
            key={item.id}
            className="border-b border-[#DADADA] last:border-none"
          >
            {(columnKey) => (
              <TableCell
                className={
                  columnKey === "actions" ? "sticky right-0 z-10 bg-white" : ""
                }
              >
                {renderCell(item, columnKey)}
              </TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export const renderEvaluatorCell = (
  item: any,
  columnKey: React.Key,
  handlers: {
    onSendNDAEmail: (item: any) => void;
    onSendNDAReminder: (item: any) => void;
    onSendCompletionReminder: (item: any) => void;
  }
) => {
  const value = item[columnKey as string];

  switch (columnKey) {
    case "nda_status":
      const getNDAStatusConfig = (status: string) => {
        switch (status) {
          case "Signed":
            return {
              text: "✓ Signed",
              bgColor: "bg-green-50",
              textColor: "text-green-700",
              borderColor: "border-green-200",
            };
          case "Pending":
            return {
              text: "⏳ Pending",
              bgColor: "bg-amber-50",
              textColor: "text-amber-700",
              borderColor: "border-amber-200",
            };
          default:
            return {
              text: "❌ Not Sent",
              bgColor: "bg-red-50",
              textColor: "text-red-700",
              borderColor: "border-red-200",
            };
        }
      };

      const statusConfig = getNDAStatusConfig(value);

      return (
        <div
          className={`px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor}`}
        >
          {statusConfig.text}
        </div>
      );

    case "nda_sent":
      const isNotSent = item.nda_status === "Not Sent";

      if (!isNotSent) {
        return (
          <div className="flex items-center justify-center">
            <div className="px-2 sm:px-3 py-1 sm:py-2 bg-gray-100 text-gray-500 rounded-lg border border-gray-200 text-xs font-medium">
              <span className="hidden sm:inline">✓ Sent</span>
              <span className="sm:hidden">✓</span>
            </div>
          </div>
        );
      }

      return (
        <div className="flex items-center justify-center">
          <button
            onClick={() => handlers.onSendNDAEmail(item)}
            className="px-2 sm:px-3 py-1 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs font-medium shadow-sm flex items-center gap-1"
            title="Send NDA Email"
          >
            <span className="hidden sm:inline">📧 Send NDA</span>
            <span className="sm:hidden">📧</span>
          </button>
        </div>
      );

    case "nda_reminder":
      const isSigned = item.nda_status === "Signed";
      const isPending = item.nda_status === "Pending";

      if (isSigned) {
        return (
          <div className="flex items-center justify-center">
            <div className="px-2 sm:px-3 py-1 sm:py-2 bg-green-50 text-green-700 rounded-lg border border-green-200 text-xs font-medium">
              <span className="hidden sm:inline">✅ Signed</span>
              <span className="sm:hidden">✅</span>
            </div>
          </div>
        );
      }

      if (!isPending) {
        return (
          <div className="flex items-center justify-center">
            <div className="px-2 sm:px-3 py-1 sm:py-2 bg-gray-100 text-gray-400 rounded-lg border border-gray-200 text-xs font-medium">
              <span className="hidden sm:inline">—</span>
              <span className="sm:hidden">—</span>
            </div>
          </div>
        );
      }

      return (
        <div className="flex items-center justify-center">
          <button
            onClick={() => handlers.onSendNDAReminder(item)}
            className="px-2 sm:px-3 py-1 sm:py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-xs font-medium shadow-sm flex items-center gap-1"
            title="Send NDA Reminder"
          >
            <span className="hidden sm:inline">� Send Reminder</span>
            <span className="sm:hidden">�</span>
          </button>
        </div>
      );

    case "restaurant_completed":
      const total = item.total_restaurant;
      const completed = item.restaurant_completed;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      const getProgressConfig = () => {
        if (completed === total && total > 0) {
          return {
            bgColor: "bg-green-100",
            progressColor: "bg-green-500",
            textColor: "text-green-700",
            icon: "✅",
            status: "Complete",
          };
        } else if (completed > 0) {
          return {
            bgColor: "bg-amber-100",
            progressColor: "bg-amber-500",
            textColor: "text-amber-700",
            icon: "🔄",
            status: "In Progress",
          };
        } else {
          return {
            bgColor: "bg-gray-100",
            progressColor: "bg-gray-400",
            textColor: "text-gray-600",
            icon: "⏸️",
            status: "Not Started",
          };
        }
      };

      const progressConfig = getProgressConfig();
      const needsReminder = completed < total && total > 0;

      return (
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-1 sm:gap-2">
              <span
                className={`text-xs font-medium ${progressConfig.textColor}`}
              >
                <span className="hidden sm:inline">{progressConfig.icon} </span>
                {completed}/{total}
              </span>
              <span className="text-xs text-gray-500 hidden sm:inline">
                ({percentage}%)
              </span>
            </div>
            <div
              className={`w-12 sm:w-16 h-1.5 rounded-full ${progressConfig.bgColor}`}
            >
              <div
                className={`h-full rounded-full transition-all duration-300 ${progressConfig.progressColor}`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
            <span
              className={`text-xs ${progressConfig.textColor} hidden sm:block`}
            >
              {progressConfig.status}
            </span>
          </div>
          {needsReminder && (
            <button
              onClick={() => handlers.onSendCompletionReminder(item)}
              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors flex items-center justify-center text-xs"
              title="Send Completion Reminder"
            >
              🔔
            </button>
          )}
        </div>
      );

    default:
      return value;
  }
};

// Render cell function for Restaurant table
export const renderRestaurantCell = (item: any, columnKey: React.Key) => {
  const value = item[columnKey as string];

  switch (columnKey) {
    case "matched":
      const getMatchConfig = (status: string) => {
        switch (status) {
          case "Yes":
            return {
              icon: "✅",
              text: "Fully Matched",
              bgColor: "bg-green-50",
              textColor: "text-green-700",
              borderColor: "border-green-200",
            };
          case "Partial":
            return {
              icon: "⚠️",
              text: "Partially Matched",
              bgColor: "bg-amber-50",
              textColor: "text-amber-700",
              borderColor: "border-amber-200",
            };
          default:
            return {
              icon: "❌",
              text: "Not Matched",
              bgColor: "bg-red-50",
              textColor: "text-red-700",
              borderColor: "border-red-200",
            };
        }
      };

      const matchConfig = getMatchConfig(value);
      return (
        <div
          className={`px-3 py-1 rounded-full text-xs font-medium border inline-flex items-center gap-1 ${matchConfig.bgColor} ${matchConfig.textColor} ${matchConfig.borderColor}`}
        >
          <span>{matchConfig.icon}</span>
          <span>{matchConfig.text}</span>
        </div>
      );

    case "evaluator_1":
    case "evaluator_2":
      if (value === "-") {
        return (
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs">Not assigned</span>
            <div className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
              Available
            </div>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-700">{value}</span>
          <div
            className="w-2 h-2 bg-blue-500 rounded-full"
            title="Assigned"
          ></div>
        </div>
      );

    case "completed_eva_1":
    case "completed_eva_2":
      if (value === "-") {
        return (
          <div className="flex items-center gap-1">
            <span className="text-gray-400 text-xs">—</span>
            <span className="text-xs text-gray-400">N/A</span>
          </div>
        );
      }

      const getCompletionConfig = (status: string) => {
        if (status === "Yes") {
          return {
            icon: "✅",
            text: "Completed",
            bgColor: "bg-green-50",
            textColor: "text-green-700",
            borderColor: "border-green-200",
          };
        } else {
          return {
            icon: "🔄",
            text: "In Progress",
            bgColor: "bg-amber-50",
            textColor: "text-amber-700",
            borderColor: "border-amber-200",
          };
        }
      };

      const completionConfig = getCompletionConfig(value);
      return (
        <div
          className={`px-2 py-1 rounded-full text-xs font-medium border inline-flex items-center gap-1 ${completionConfig.bgColor} ${completionConfig.textColor} ${completionConfig.borderColor}`}
        >
          <span>{completionConfig.icon}</span>
          <span>{completionConfig.text}</span>
        </div>
      );

    case "category":
      const getCategoryIcon = (category: string) => {
        switch (category.toLowerCase()) {
          case "local cuisine":
            return "🍛";
          case "fast food":
            return "🍔";
          case "bakery":
            return "🥖";
          case "italian":
            return "🍝";
          case "asian cuisine":
            return "🍜";
          default:
            return "🍽️";
        }
      };

      return (
        <div className="flex items-center gap-2">
          <span className="text-sm">{getCategoryIcon(value)}</span>
          <span className="text-xs text-gray-700">{value}</span>
        </div>
      );

    default:
      return value;
  }
};