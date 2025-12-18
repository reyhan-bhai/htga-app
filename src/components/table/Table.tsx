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

  const renderCell = customRenderCell || defaultRenderCell;

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
