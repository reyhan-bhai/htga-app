import React from "react";
import {
  Button,
  Checkbox,
  Divider,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@nextui-org/react";
import { MdAdd, MdClose, MdFilterList, MdSearch } from "react-icons/md";

interface EvaluatorFiltersSectionProps {
  selectedCities: string[];
  setSelectedCities: (cities: string[]) => void;
  selectedStatus: string[];
  setSelectedStatus: (statuses: string[]) => void;
  activeFiltersCount: number;
  cities: string[];
  statuses: string[];
  toggleCity: (city: string) => void;
  toggleStatus: (status: string) => void;
  clearFilters: () => void;
  handleAddEvaluator: () => void;
}

export default function EvaluatorFiltersSection({
  selectedCities,
  selectedStatus,
  activeFiltersCount,
  cities,
  statuses,
  toggleCity,
  toggleStatus,
  clearFilters,
  handleAddEvaluator,
}: EvaluatorFiltersSectionProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 md:bg-transparent">
      <div className="flex flex-row gap-3 w-full md:w-auto items-center">
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
                <span className="font-medium text-sm text-gray-700">City</span>
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
                <span className="font-medium text-sm text-gray-700">Status</span>
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
        className="bg-[#A67C37] text-white font-semibold rounded-full p-0"
        startContent={<MdAdd size={30} />}
        onPress={handleAddEvaluator}
      ></Button>
    </div>
  );
}