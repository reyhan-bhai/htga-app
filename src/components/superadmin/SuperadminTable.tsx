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

export interface SuperadminAdminRow {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

interface SuperadminTableProps {
  isLoading: boolean;
  data: SuperadminAdminRow[];
  onEdit?: (item: SuperadminAdminRow) => void;
  onDelete?: (item: SuperadminAdminRow) => void;
  onView?: (item: SuperadminAdminRow) => void;
}

const columns = [
  { name: "NAME", uid: "name" },
  { name: "EMAIL", uid: "email" },
  { name: "ROLE", uid: "role" },
  { name: "STATUS", uid: "status" },
  { name: "ACTIONS", uid: "actions" },
];

export default function SuperadminTable({
  isLoading,
  data,
  onEdit,
  onDelete,
  onView,
}: SuperadminTableProps) {
  const renderCell = React.useCallback(
    (row: SuperadminAdminRow, columnKey: React.Key) => {
      switch (columnKey) {
        case "status":
          return (
            <span
              className={`px-2 py-1 rounded font-semibold ${
                row.isActive
                  ? "bg-green-50 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {row.isActive ? "Active" : "Disabled"}
            </span>
          );
        case "role":
          return (
            <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 font-semibold">
              {row.role}
            </span>
          );
        case "actions":
          return (
            <div className="relative flex items-center justify-center gap-2">
              {onEdit ? (
                <Tooltip content="Edit" className="bg-black text-white">
                  <span
                    className="text-lg text-default-400 cursor-pointer active:opacity-50"
                    onClick={() => onEdit(row)}
                  >
                    <MdEdit />
                  </span>
                </Tooltip>
              ) : null}
              {onDelete ? (
                <Tooltip color="danger" content="Delete">
                  <span
                    className="text-lg text-default-400 cursor-pointer active:opacity-50"
                    onClick={() => onDelete(row)}
                  >
                    <MdDelete />
                  </span>
                </Tooltip>
              ) : null}
              {onView ? (
                <Tooltip content="Details" className="bg-black text-white">
                  <span
                    className="text-lg text-default-400 cursor-pointer active:opacity-50"
                    onClick={() => onView(row)}
                  >
                    <MdInfoOutline />
                  </span>
                </Tooltip>
              ) : null}
            </div>
          );
        default: {
          const value = row[columnKey as keyof SuperadminAdminRow];
          return String(value ?? "—");
        }
      }
    },
    [onDelete, onEdit, onView],
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg overflow-hidden">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table
          aria-label="Superadmin Admin Accounts Table"
          classNames={{
            wrapper:
              "min-h-[400px] shadow-none border border-gray-200 rounded-lg p-0",
            th: "bg-blue-600 text-white font-bold text-sm !rounded-none",
            td: "text-sm text-gray-700 py-3 font-medium",
          }}
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn
                key={column.uid}
                align={column.uid === "actions" ? "center" : "start"}
                className={
                  column.uid === "actions"
                    ? "sticky right-0 z-20 bg-blue-600"
                    : ""
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
                      No admins found
                    </h3>
                    <p className="text-sm text-gray-500">
                      Create your first admin account.
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
                      columnKey === "actions"
                        ? "sticky right-0 z-10 bg-white"
                        : ""
                    }
                  >
                    {renderCell(item, columnKey)}
                  </TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
