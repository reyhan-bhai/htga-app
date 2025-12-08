"use client";

import TableComponent from "@/components/table/Table";
import {
  Button,
  Checkbox,
  Divider,
  Input,
  Pagination,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@nextui-org/react";
import React from "react";
import { MdAdd, MdClose, MdFilterList, MdSearch } from "react-icons/md";

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
  const [selectedCities, setSelectedCities] = React.useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = React.useState<string[]>([]);

  const cities = ["Johor", "Kuala Lumpur", "Penang", "Selangor"];
  const statuses = ["Assigned", "Unassigned"];

  const toggleCity = (city: string) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  };

  const toggleStatus = (status: string) => {
    setSelectedStatus((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const clearFilters = () => {
    setSelectedCities([]);
    setSelectedStatus([]);
  };

  const activeFiltersCount = selectedCities.length + selectedStatus.length;

  return (
    <div className="text-black flex flex-col gap-6">
      <h2 className="text-2xl font-bold uppercase">Evaluator Management</h2>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
          {/* Search Input */}
          <Input
            placeholder="Search by name, email, ID, city or status..."
            className="w-full md:w-[350px]"
            size="sm"
            variant="bordered"
            startContent={<MdSearch className="text-black" size={18} />}
            classNames={{
              inputWrapper: "bg-white border-gray-300 rounded-md text-red",
              input: "text-black placeholder:text-gray-500",
            }}
          />

          {/* Filter Popover */}
          <Popover placement="bottom-start">
            <PopoverTrigger>
              <Button
                isIconOnly
                className="bg-white border border-gray-300 rounded-md relative overflow-visible"
                size="sm"
              >
                <MdFilterList size={20} className="text-gray-500" />
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#A67C37] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center z-10 border-2 border-white">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-4 w-[280px] bg-white shadow-lg rounded-lg">
              <div className="flex flex-col gap-4 text-black">
                {/* Header */}
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-base">Filters</span>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-[#A67C37] hover:underline flex items-center gap-1"
                    >
                      <MdClose size={14} />
                      Clear all
                    </button>
                  )}
                </div>

                <Divider className="bg-gray-200" />

                {/* City Filter */}
                <div className="flex flex-col gap-2">
                  <span className="font-medium text-sm text-gray-700">
                    City
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {cities.map((city) => (
                      <Checkbox
                        key={city}
                        size="sm"
                        isSelected={selectedCities.includes(city)}
                        onValueChange={() => toggleCity(city)}
                        classNames={{
                          label: "text-black text-sm",
                        }}
                      >
                        {city}
                      </Checkbox>
                    ))}
                  </div>
                </div>

                <Divider className="bg-gray-200" />

                {/* Status Filter */}
                <div className="flex flex-col gap-2">
                  <span className="font-medium text-sm text-gray-700">
                    Status
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {statuses.map((status) => (
                      <Checkbox
                        key={status}
                        size="sm"
                        isSelected={selectedStatus.includes(status)}
                        onValueChange={() => toggleStatus(status)}
                        classNames={{
                          label: "text-black text-sm",
                        }}
                      >
                        {status}
                      </Checkbox>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
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
