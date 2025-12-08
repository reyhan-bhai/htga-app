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
}

export default function TableComponent({ columns, data }: TableComponentProps) {
  const renderCell = React.useCallback((user: any, columnKey: React.Key) => {
    const cellValue = user[columnKey as keyof typeof user];

    switch (columnKey) {
      case "actions":
        return (
          <div className="relative flex items-center justify-center gap-2">
            <Tooltip content="Edit">
              <span className="text-lg text-default-400 cursor-pointer active:opacity-50">
                <MdEdit />
              </span>
            </Tooltip>
            <Tooltip color="danger" content="Delete">
              <span className="text-lg text-default-400 cursor-pointer active:opacity-50">
                <MdDelete />
              </span>
            </Tooltip>
            <Tooltip content="Details">
              <span className="text-lg text-default-400 cursor-pointer active:opacity-50">
                <MdInfoOutline />
              </span>
            </Tooltip>
          </div>
        );
      default:
        return cellValue;
    }
  }, []);

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
      <TableBody items={data}>
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
