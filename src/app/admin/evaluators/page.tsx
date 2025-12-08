"use client";

import React from "react";
import TableComponent from "@/components/table/Table";
import { Button, Pagination, Select, SelectItem } from "@nextui-org/react";
import { MdAdd } from "react-icons/md";

const columns = [
  { name: "ID", uid: "id" },
  { name: "Nama Evaluator", uid: "name" },
  { name: "Email/Contact", uid: "email" },
  { name: "Phone Number", uid: "phone" },
  { name: "Current Position", uid: "position" },
  { name: "Company/Organization", uid: "company" },
  { name: "Actions", uid: "actions" },
];

const users = [
  {
    id: "09989",
    name: "Fajar Ramdani",
    email: "fajarrmdni@gmail.com",
    phone: "+601461116987",
    position: "Johor Chef Association",
    company: "Pastry",
  },
  {
    id: "09990",
    name: "Raihan Muhammad...",
    email: "reyhanMf@gmail.com",
    phone: "+601461116987",
    position: "Johor Chef Association",
    company: "081234562345",
  },
  {
    id: "09991",
    name: "Raihan Muhammad...",
    email: "raihanmf@gmail.com",
    phone: "+601461116987",
    position: "Johor Chef Association",
    company: "raihanmf@gmail.com",
  },
  {
    id: "09992",
    name: "Ayunda Cinta Dinan...",
    email: "ayundacinta@gmail.com",
    phone: "+601461116987",
    position: "Johor Chef Association",
    company: "ayundacinta@gmail.com",
  },
  {
    id: "09993",
    name: "Putra Indika Malik",
    email: "putrdik@gmail.com",
    phone: "+601461116987",
    position: "Catalyse",
    company: "putrdik@gmail.com",
  },
  {
    id: "09994",
    name: "Putra Indika Malik",
    email: "purta@gmail.com",
    phone: "+601461116987",
    position: "Catalyse",
    company: "081265437890",
  },
  {
    id: "09994",
    name: "Putra Indika Malik",
    email: "purta@gmail.com",
    phone: "+601461116987",
    position: "Catalyse",
    company: "081265437890",
  },
  {
    id: "09994",
    name: "Putra Indika Malik",
    email: "purta@gmail.com",
    phone: "+601461116987",
    position: "Catalyse",
    company: "081265437890",
  },
  {
    id: "09994",
    name: "Putra Indika Malik",
    email: "purta@gmail.com",
    phone: "+601461116987",
    position: "Catalyse",
    company: "081265437890",
  },
];

export default function EvaluatorsPage() {
  const [page, setPage] = React.useState(1);

  return (
    <div className="text-black flex flex-col gap-6">
      <h2 className="text-2xl font-bold uppercase">Evaluator Management</h2>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <Select
            placeholder="ID / EMAIL"
            className="w-[200px]"
            size="sm"
            variant="bordered"
            classNames={{
              trigger: "bg-white border-gray-300 rounded-md",
            }}
          >
            <SelectItem key="id">ID</SelectItem>
            <SelectItem key="email">Email</SelectItem>
          </Select>

          <Select
            placeholder="City"
            className="w-[150px]"
            size="sm"
            variant="bordered"
            classNames={{
              trigger: "bg-white border-gray-300 rounded-md",
            }}
          >
            <SelectItem key="johor">Johor</SelectItem>
            <SelectItem key="kl">Kuala Lumpur</SelectItem>
          </Select>

          <Select
            placeholder="Sudah Ditugaskan"
            className="w-[200px]"
            size="sm"
            variant="bordered"
            classNames={{
              trigger: "bg-white border-gray-300 rounded-md",
            }}
          >
            <SelectItem key="assigned">Sudah Ditugaskan</SelectItem>
            <SelectItem key="unassigned">Belum Ditugaskan</SelectItem>
          </Select>
        </div>

        <Button
          className="bg-[#A67C37] text-white font-semibold rounded-full px-6"
          startContent={<MdAdd size={20} />}
        >
          add new evaluator
        </Button>
      </div>

      <div className="bg-white rounded-lg">
        <TableComponent columns={columns} data={users} />
      </div>

      <div className="flex justify-center items-center mt-4">
        <div className="block md:hidden">
          <Pagination
            isCompact
            showControls
            total={10}
            page={page}
            onChange={setPage}
            siblings={0}
            classNames={{
              cursor: "bg-[#A67C37] text-white font-bold",
            }}
          />
        </div>
        <div className="hidden md:block">
          <Pagination
            showControls
            total={10}
            page={page}
            onChange={setPage}
            classNames={{
              cursor: "bg-[#A67C37] text-white font-bold",
            }}
          />
        </div>
      </div>
    </div>
  );
}
