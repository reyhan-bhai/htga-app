import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
} from "@nextui-org/react";
import Image from "next/image";
import React from "react";
import {
  MdDelete,
  MdEdit,
  MdInfoOutline,
  MdNotificationsActive,
} from "react-icons/md";

interface AdminTableProps {
  type: "assignment" | "evaluator" | "restaurant" | "budget";
  isLoading: boolean;

  // Assignment Props
  selectedView?: string;
  evaluatorViewData?: any[];
  restaurantViewData?: any[];
  evaluators?: any[];
  establishments?: any[];
  assignments?: any[];
  setEditingRestaurant?: (restaurant: any) => void;
  setEditEvaluator1?: (id: string) => void;
  setEditEvaluator2?: (id: string) => void;
  setIsEditModalOpen?: (open: boolean) => void;
  handleViewDetails?: (item: any) => void;
  handleEdit?: (
    item: any,
    selectedView: string,
    assignments: any[],
    setEditingRestaurant: (restaurant: any) => void,
    setEditEvaluator1: (id: string) => void,
    setEditEvaluator2: (id: string) => void,
    setIsEditModalOpen: (open: boolean) => void,
  ) => void;
  handleSendNDAEmail?: (evaluator: any) => void;
  handleSendNDAReminder?: (evaluator: any) => void;
  handleSendCompletionReminder?: (evaluator: any) => void;

  // Evaluator & Restaurant Props
  data?: any[];
  handleEditItem?: (item: any) => void;
  handleViewItem?: (item: any) => void;
  handleDeleteItem?: (item: any) => void;
  columns?: any[];
  renderCell?: (item: any, columnKey: React.Key) => React.ReactNode;
  emptyMessage?: {
    title: string;
    description: string;
  };
  hideActions?: boolean;
}

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

function TableComponent({
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
          // Safety check for objects to prevent React error
          if (typeof cellValue === "object" && cellValue !== null) {
            return <span className="text-gray-400 italic">—</span>;
          }
          return String(cellValue || "—");
      }
    },
    [onEdit, onDelete, onView, hideActions],
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
    [customRenderCell, defaultRenderCell],
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

export default function AdminTable({
  type,
  isLoading,
  // Assignment
  selectedView,
  evaluatorViewData = [],
  restaurantViewData = [],
  evaluators = [],
  assignments = [],
  setEditingRestaurant,
  setEditEvaluator1,
  setEditEvaluator2,
  setIsEditModalOpen,
  handleViewDetails,
  handleEdit,
  handleSendNDAEmail,
  handleSendNDAReminder,
  handleSendCompletionReminder,
  // Evaluator & Restaurant
  data = [],
  handleEditItem,
  handleViewItem,
  handleDeleteItem,
  columns = [],
  renderCell,
}: AdminTableProps) {
  const [previewImage, setPreviewImage] = React.useState<string | null>(null);

  const handlePreviewImage = (imageUrl: string) => {
    setPreviewImage(imageUrl);
  };

  const handleClosePreview = () => {
    setPreviewImage(null);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg overflow-hidden">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A67C37]"></div>
        </div>
      </div>
    );
  }

  const tableContent = (() => {
    switch (type) {
      case "assignment":
        return (
          <div className="bg-white rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              {selectedView === "evaluator" ? (
                <TableComponent
                  columns={columns}
                  data={evaluatorViewData}
                  onView={handleViewDetails}
                  onEdit={(item) =>
                    handleEdit?.(
                      item,
                      selectedView,
                      assignments,
                      setEditingRestaurant!,
                      setEditEvaluator1!,
                      setEditEvaluator2!,
                      setIsEditModalOpen!,
                    )
                  }
                  hideActions={true}
                  renderCell={(item, columnKey) =>
                    renderEvaluatorCell(item, columnKey, {
                      onSendNDAEmail: handleSendNDAEmail!,
                      onSendNDAReminder: handleSendNDAReminder!,
                      onSendCompletionReminder: handleSendCompletionReminder!,
                    })
                  }
                  emptyMessage={{
                    title:
                      evaluators.length === 0
                        ? "No evaluators yet"
                        : "No assignments yet",
                    description:
                      evaluators.length === 0
                        ? "Add evaluators first in the Evaluators page."
                        : "Click 'Match Evaluator' to start assigning evaluators to restaurants.",
                  }}
                />
              ) : (
                <TableComponent
                  columns={columns}
                  data={restaurantViewData}
                  onEdit={(item) =>
                    handleEdit?.(
                      item,
                      selectedView!,
                      assignments,
                      setEditingRestaurant!,
                      setEditEvaluator1!,
                      setEditEvaluator2!,
                      setIsEditModalOpen!,
                    )
                  }
                  // onView={handleViewDetails} There is no detail button in assignment so we comment this
                  renderCell={(item, columnKey) =>
                    renderRestaurantCell(item, columnKey, {
                      onPreviewImage: handlePreviewImage,
                    })
                  }
                  emptyMessage={{
                    title: "No restaurants found",
                    description: "Add restaurants in the Restaurants page.",
                  }}
                />
              )}
            </div>
          </div>
        );

      case "evaluator":
        return (
          <div className="bg-white rounded-lg">
            <TableComponent
              columns={columns}
              data={data}
              onEdit={handleEditItem}
              onView={handleViewItem}
              onDelete={handleDeleteItem}
              renderCell={(item, columnKey) =>
                renderEvaluatorListCell(item, columnKey)
              }
            />
          </div>
        );

      case "restaurant":
        return (
          <div className="bg-white rounded-lg">
            <TableComponent
              columns={columns}
              data={data}
              onEdit={handleEditItem}
              onView={handleViewItem}
              onDelete={handleDeleteItem}
            />
          </div>
        );

      case "budget":
        return (
          <div className="bg-white rounded-lg">
            <TableComponent
              columns={columns}
              data={data}
              renderCell={renderCell}
              emptyMessage={{
                title: "No Budget Data",
                description: "No evaluator budget data found.",
              }}
              hideActions={true}
            />
          </div>
        );

      default:
        return null;
    }
  })();

  return (
    <>
      {tableContent}

      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          role="dialog"
          aria-modal="true"
          onClick={handleClosePreview}
        >
          <div
            className="max-h-[85vh] w-full max-w-3xl rounded-3xl bg-white p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-end">
              <button
                onClick={handleClosePreview}
                className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-600"
              >
                Close
              </button>
            </div>
            <div className="mt-3 flex justify-center">
              <Image
                src={previewImage}
                alt="Receipt preview"
                width={900}
                height={700}
                className="max-h-[70vh] w-auto rounded-2xl object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const renderEvaluatorCell = (
  item: any,
  columnKey: React.Key,
  handlers: {
    onSendNDAEmail: (item: any) => void;
    onSendNDAReminder: (item: any) => void;
    onSendCompletionReminder: (item: any) => void;
  },
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

    case "nda_reminder": {
      const isSigned = item.nda_status === "Signed";

      return (
        <div className="flex items-center justify-center">
          <button
            onClick={() => !isSigned && handlers.onSendNDAReminder(item)}
            disabled={isSigned}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
              isSigned
                ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                : "bg-white text-amber-600 border border-amber-200 hover:bg-amber-50 hover:border-amber-300 shadow-sm"
            }`}
            title={isSigned ? "NDA already signed" : "Send NDA Reminder"}
          >
            <span className="text-lg">
              <MdNotificationsActive />
            </span>
            <span className="hidden sm:inline">Remind</span>
          </button>
        </div>
      );
    }

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
              <MdNotificationsActive />
            </button>
          )}
        </div>
      );

    case "total_reminder_sent":
      const reminderCount = item.total_reminder_sent || 0;
      return (
        <div className="flex items-center justify-center">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${
              reminderCount > 0
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-gray-50 border-gray-200 text-gray-400"
            }`}
          >
            <span className="font-semibold text-sm">{reminderCount}</span>
          </div>
        </div>
      );

    default:
      // Safety check for objects to prevent React error
      if (typeof value === "object" && value !== null) {
        return <span className="text-gray-400 italic">—</span>;
      }
      return String(value || "—");
  }
};

const renderEvaluatorListCell = (item: any, columnKey: React.Key) => {
  if (columnKey !== "specialties") {
    return undefined;
  }

  const rawValue = item.specialties;
  console.log("Evaluator specialties:", item.id, rawValue);

  if (Array.isArray(rawValue)) {
    return rawValue.length > 0 ? rawValue.join(", ") : "—";
  }

  if (typeof rawValue === "string") {
    return rawValue.trim() || "—";
  }

  return "—";
};

const renderRestaurantCell = (
  item: any,
  columnKey: React.Key,
  handlers: {
    onPreviewImage: (imageUrl: string) => void;
  },
) => {
  if (columnKey === "actions") {
    return undefined;
  }
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

    case "evaluator1_assigned_date":
    case "evaluator2_assigned_date":
    case "date_assigned":
      if (!value || value === "-") {
        return (
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs italic">Not assigned</span>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-700">{value}</span>
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
      // const getCategoryIcon = (category: string) => {
      //   switch (category.toLowerCase()) {
      //     case "local cuisine":
      //       return "🍛";
      //     case "fast food":
      //       return "🍔";
      //     case "bakery":
      //       return "🥖";
      //     case "italian":
      //       return "🍝";
      //     case "asian cuisine":
      //       return "🍜";
      //     default:
      //       return "🍽️";
      //   }
      // };

      return (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-700">{value}</span>
        </div>
      );

    case "evaluator1_receipt":
    case "evaluator2_receipt":
      if (value) {
        return (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlers.onPreviewImage(value)}
              className="rounded-xl border border-gray-200 p-1 shadow-sm transition hover:border-[#A67C37]"
            >
              <Image
                src={value}
                alt="Receipt thumbnail"
                width={64}
                height={64}
                className="h-16 w-16 rounded-lg object-cover"
              />
            </button>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-2">
          <span className="text-gray-400 italic text-xs">No image yet</span>
        </div>
      );

    case "evaluator1_amount_spent":
    case "evaluator2_amount_spent":
      if (value !== null && value !== undefined && value !== "") {
        return (
          <div className="flex items-center gap-2">
            {/* this will be fetched from firebase for the money currency */}
            <span className="text-xs text-gray-700">
              {" "}
              {"{"}moneyCurrency{"}"} {value}
            </span>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-2">
          <span className="text-gray-400 italic text-xs">-</span>
        </div>
      );

    default:
      // Safety check for objects to prevent React error
      if (typeof value === "object" && value !== null) {
        return <span className="text-gray-400 italic">—</span>;
      }
      return String(value || "—");
  }
};
