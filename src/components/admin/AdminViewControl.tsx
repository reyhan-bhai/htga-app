import {
  Button,
  Checkbox,
  Divider,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectItem,
  Tab,
  Tabs,
} from "@nextui-org/react";
import {
  MdAdd,
  MdClose,
  MdFilterList,
  MdPeople,
  MdRestaurant,
  MdSearch,
} from "react-icons/md";

interface AdminViewControlProps {
  type: "assignment" | "evaluator" | "restaurant";

  // Common
  activeFiltersCount?: number;
  clearFilters?: () => void;

  // Assignment
  selectedView?: string;
  setSelectedView?: (view: string) => void;
  selectedNDAStatus?: string[];
  setSelectedNDAStatus?: (statuses: string[]) => void;
  selectedMatchStatus?: string[];
  setSelectedMatchStatus?: (statuses: string[]) => void;
  evaluatorViewData?: any[];
  restaurantViewData?: any[];

  // Evaluator & Restaurant Common
  selectedCities?: string[];
  setSelectedCities?: (cities: string[]) => void;
  selectedStatus?: string[];
  setSelectedStatus?: (statuses: string[]) => void;
  cities?: string[];
  statuses?: string[];
  toggleCity?: (city: string) => void;
  toggleStatus?: (status: string) => void;

  // Evaluator Only
  selectedSpecialties?: string[];
  setSelectedSpecialties?: (specialties: string[]) => void;
  specialties?: string[];
  toggleSpecialty?: (specialty: string) => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  rowsPerPage?: number;
  setRowsPerPage?: (rows: number) => void;

  // Restaurant
  handleAddRestaurant?: () => void;

  // Evaluator
  handleAddEvaluator?: () => void;
}

export default function AdminViewControl({
  type,
  activeFiltersCount = 0,
  clearFilters,
  selectedView,
  setSelectedView,
  selectedNDAStatus,
  setSelectedNDAStatus,
  selectedMatchStatus,
  setSelectedMatchStatus,
  evaluatorViewData = [],
  restaurantViewData = [],
  selectedSpecialties = [],
  specialties = [],
  toggleSpecialty,
  searchQuery = "",
  setSearchQuery,
  rowsPerPage = 10,
  setRowsPerPage,
  handleAddEvaluator,
  handleAddRestaurant,
}: AdminViewControlProps) {
  switch (type) {
    case "assignment":
      return (
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Modern Tab Toggle */}
          <div className="bg-gray-100 p-1 rounded-xl flex w-full sm:w-fit">
            <Tabs
              selectedKey={selectedView}
              onSelectionChange={(key) => setSelectedView?.(key as string)}
              variant="light"
              className="w-full sm:w-auto"
              classNames={{
                tabList:
                  "gap-1 bg-transparent w-full grid grid-cols-2 sm:flex sm:w-auto",
                cursor: "bg-[#A67C37] shadow-md",
                tab: "px-2 sm:px-6 py-2 font-semibold",
                tabContent:
                  "group-data-[selected=true]:text-white text-gray-600 text-xs sm:text-base",
              }}
            >
              <Tab
                key="evaluator"
                title={
                  <div className="flex items-center gap-1 sm:gap-2 justify-center">
                    <MdPeople
                      size={16}
                      className="w-[14px] h-[14px] sm:w-[18px] sm:h-[18px]"
                    />
                    <span className="hidden sm:inline">By Evaluator</span>
                    <span className="sm:hidden">Evaluator</span>
                  </div>
                }
              />
              <Tab
                key="restaurant"
                title={
                  <div className="flex items-center gap-1 sm:gap-2 justify-center">
                    <MdRestaurant
                      size={16}
                      className="w-[14px] h-[14px] sm:w-[18px] sm:h-[18px]"
                    />
                    <span className="hidden sm:inline">By Restaurant</span>
                    <span className="sm:hidden">Restaurant</span>
                  </div>
                }
              />
            </Tabs>
          </div>

          {/* Search and Filter Row */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="flex flex-row gap-2 sm:gap-3 w-full sm:w-auto items-center">
              {/* Search Input */}
              <Input
                placeholder={
                  selectedView === "evaluator"
                    ? "Search evaluators..."
                    : "Search restaurants..."
                }
                className="w-full sm:w-[280px] md:w-[350px]"
                size="sm"
                variant="bordered"
                startContent={<MdSearch className="text-black" size={16} />}
                classNames={{
                  inputWrapper:
                    "bg-white border-gray-300 rounded-md h-8 sm:h-10",
                  input: "text-black placeholder:text-gray-500 text-sm",
                }}
              />

              {/* Filter Popover */}
              <Popover placement="bottom-start">
                <PopoverTrigger>
                  <Button
                    isIconOnly
                    className="bg-white border border-gray-300 rounded-md relative overflow-visible min-w-8 sm:min-w-10 h-8 sm:h-10"
                    size="sm"
                  >
                    <MdFilterList
                      size={16}
                      className="text-gray-500 sm:w-5 sm:h-5"
                    />
                    {activeFiltersCount > 0 && (
                      <span className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 bg-[#A67C37] text-white text-xs w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center z-10 border-2 border-white">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-3 sm:p-4 w-[250px] sm:w-[280px] bg-white shadow-lg rounded-lg">
                  <div className="flex flex-col gap-3 sm:gap-4 text-black">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm sm:text-base">
                        Filters
                      </span>
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

                    {selectedView === "evaluator" ? (
                      /* NDA Status Filter for Evaluator View */
                      <div className="flex flex-col gap-2">
                        <span className="font-medium text-xs sm:text-sm text-gray-700">
                          NDA Status
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {["Signed", "Pending", "Not Sent"].map((status) => (
                            <Checkbox
                              key={status}
                              size="sm"
                              isSelected={selectedNDAStatus?.includes(status)}
                              onValueChange={() => {
                                if (selectedNDAStatus && setSelectedNDAStatus) {
                                  const newStatus = selectedNDAStatus.includes(
                                    status
                                  )
                                    ? selectedNDAStatus.filter(
                                        (s) => s !== status
                                      )
                                    : [...selectedNDAStatus, status];
                                  setSelectedNDAStatus(newStatus);
                                }
                              }}
                              classNames={{
                                label: "text-black text-xs sm:text-sm",
                              }}
                            >
                              {status}
                            </Checkbox>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* Match Status Filter for Restaurant View */
                      <div className="flex flex-col gap-2">
                        <span className="font-medium text-xs sm:text-sm text-gray-700">
                          Match Status
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {["Yes", "Partial", "No"].map((status) => (
                            <Checkbox
                              key={status}
                              size="sm"
                              isSelected={selectedMatchStatus?.includes(status)}
                              onValueChange={() => {
                                if (
                                  selectedMatchStatus &&
                                  setSelectedMatchStatus
                                ) {
                                  const newStatus =
                                    selectedMatchStatus.includes(status)
                                      ? selectedMatchStatus.filter(
                                          (s) => s !== status
                                        )
                                      : [...selectedMatchStatus, status];
                                  setSelectedMatchStatus(newStatus);
                                }
                              }}
                              classNames={{
                                label: "text-black text-xs sm:text-sm",
                              }}
                            >
                              {status === "Yes"
                                ? "Matched"
                                : status === "Partial"
                                  ? "Partial"
                                  : "Unassigned"}
                            </Checkbox>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Summary Stats */}
            {(evaluatorViewData.length > 0 ||
              restaurantViewData.length > 0) && (
              <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
                {selectedView === "evaluator" ? (
                  <>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
                      <span className="text-gray-600 whitespace-nowrap">
                        <span className="hidden sm:inline">NDA Signed: </span>
                        <span className="sm:hidden">Signed: </span>
                        {
                          evaluatorViewData.filter(
                            (e) => e.nda_status === "Signed"
                          ).length
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-gray-600 whitespace-nowrap">
                        Pending:{" "}
                        {
                          evaluatorViewData.filter(
                            (e) => e.nda_status === "Pending"
                          ).length
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
                      <span className="text-gray-600 whitespace-nowrap">
                        <span className="hidden sm:inline">Not Sent: </span>
                        <span className="sm:hidden">Unsent: </span>
                        {
                          evaluatorViewData.filter(
                            (e) => e.nda_status === "Not Sent"
                          ).length
                        }
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
                      <span className="text-gray-600 whitespace-nowrap">
                        Matched:{" "}
                        {
                          restaurantViewData.filter((r) => r.matched === "Yes")
                            .length
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-gray-600 whitespace-nowrap">
                        Partial:{" "}
                        {
                          restaurantViewData.filter(
                            (r) => r.matched === "Partial"
                          ).length
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
                      <span className="text-gray-600 whitespace-nowrap">
                        <span className="hidden sm:inline">Unassigned: </span>
                        <span className="sm:hidden">None: </span>
                        {
                          restaurantViewData.filter((r) => r.matched === "No")
                            .length
                        }
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      );

    case "evaluator":
    case "restaurant":
      return (
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 md:bg-transparent">
          <div className="flex flex-row gap-3 w-full md:w-auto items-center">
            {/* Search Input */}
            <Input
              placeholder="Search..."
              className="w-full md:w-[350px]"
              size="sm"
              variant="bordered"
              value={searchQuery}
              onValueChange={setSearchQuery}
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

                  <Divider className="bg-gray-200" />

                  {specialties && specialties.length > 0 && (
                    <>
                      {/* Specialties Filter */}
                      <div className="flex flex-col gap-2">
                        <span className="font-medium text-sm text-gray-700">
                          Specialties
                        </span>
                        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                          {specialties.map((specialty) => (
                            <Checkbox
                              key={specialty}
                              size="sm"
                              isSelected={selectedSpecialties.includes(
                                specialty
                              )}
                              onValueChange={() => toggleSpecialty?.(specialty)}
                              classNames={{
                                label: "text-black text-sm",
                              }}
                            >
                              {specialty}
                            </Checkbox>
                          ))}
                        </div>
                      </div>

                      <Divider className="bg-gray-200" />
                    </>
                  )}

                  <Divider className="bg-gray-200" />

                  {/* Rows Per Page Selector */}
                  <div className="flex flex-col gap-2">
                    <span className="font-medium text-sm text-gray-700">
                      Rows Per Page
                    </span>
                    <Select
                      selectedKeys={[rowsPerPage.toString()]}
                      onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0];
                        if (value && setRowsPerPage) {
                          setRowsPerPage(parseInt(value as string));
                        }
                      }}
                      size="sm"
                      variant="bordered"
                      classNames={{
                        trigger:
                          "bg-white border-gray-300 rounded-md h-9 text-black",
                        value: "text-black text-sm",
                        listboxWrapper: "text-gray-500",
                        popoverContent: "text-gray-500",
                      }}
                    >
                      <SelectItem key="10" value="10" className="text-gray-600">
                        10
                      </SelectItem>
                      <SelectItem key="25" value="25" className="text-gray-600">
                        25
                      </SelectItem>
                      <SelectItem key="50" value="50" className="text-gray-600">
                        50
                      </SelectItem>
                      <SelectItem key="100" value="100" className="text-gray-600">
                        100
                      </SelectItem>
                    </Select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <Button
            className="bg-[#A67C37] text-white font-semibold rounded-full p-0"
            startContent={<MdAdd size={30} />}
            onPress={
              type === "evaluator" ? handleAddEvaluator : handleAddRestaurant
            }
          ></Button>
        </div>
      );

    default:
      return null;
  }
}
