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
  type: "assignment" | "evaluator" | "restaurant" | "budget";

  // Common
  activeFiltersCount?: number;
  clearFilters?: () => void;

  // Budget Only
  selectedDateRange?: { start: string; end: string };
  setSelectedDateRange?: (range: { start: string; end: string }) => void;

  // Assignment Only
  selectedView?: string;
  setSelectedView?: (view: string) => void;
  selectedNDAStatus?: string[];
  setSelectedNDAStatus?: (statuses: string[]) => void;
  selectedSpecialties?: string[];
  setSelectedSpecialties?: (specialties: string[]) => void;
  specialties?: string[];
  toggleSpecialty?: (specialty: string) => void;
  showIncompleteOnly?: boolean;
  setShowIncompleteOnly?: (show: boolean) => void;
  selectedMatchStatus?: string[];
  setSelectedMatchStatus?: (statuses: string[]) => void;
  selectedCategories?: string[];
  setSelectedCategories?: (categories: string[]) => void;
  categories?: string[];
  toggleCategory?: (category: string) => void;
  selectedEvaOneProgress?: string[];
  setSelectedEvaOneProgress?: (statuses: string[]) => void;
  selectedEvaTwoProgress?: string[];
  setSelectedEvaTwoProgress?: (statuses: string[]) => void;
  toggleEvaOneProgress?: (status: string) => void;
  toggleEvaTwoProgress?: (status: string) => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  rowsPerPage?: number;
  setRowsPerPage?: (rows: number) => void;

  // Evaluator Only
  selectedCities?: string[];
  setSelectedCities?: (cities: string[]) => void;
  selectedStatus?: string[];
  setSelectedStatus?: (statuses: string[]) => void;
  cities?: string[];
  statuses?: string[];
  toggleCity?: (city: string) => void;
  toggleStatus?: (status: string) => void;

  // Restaurant Only
  ratingRange?: { min: number; max: number };
  setRatingRange?: (range: { min: number; max: number }) => void;
  budgetRange?: { min: number; max: number };
  setBudgetRange?: (range: { min: number; max: number }) => void;

  // For Summary Stats
  evaluatorViewData?: any[];
  restaurantViewData?: any[];

  // Buttons
  handleAddRestaurant?: () => void;
  handleAddEvaluator?: () => void;
}

export default function AdminViewControl({
  type,
  activeFiltersCount = 0,
  clearFilters,
  selectedDateRange,
  setSelectedDateRange,
  selectedView,
  setSelectedView,
  selectedNDAStatus,
  setSelectedNDAStatus,
  selectedSpecialties,
  specialties,
  toggleSpecialty,
  showIncompleteOnly,
  setShowIncompleteOnly,
  selectedMatchStatus,
  setSelectedMatchStatus,
  selectedCategories,
  categories,
  toggleCategory,
  selectedEvaOneProgress,
  selectedEvaTwoProgress,
  toggleEvaOneProgress,
  toggleEvaTwoProgress,
  searchQuery = "",
  setSearchQuery,
  rowsPerPage = 10,
  setRowsPerPage,
  ratingRange,
  setRatingRange,
  budgetRange,
  setBudgetRange,
  evaluatorViewData = [],
  restaurantViewData = [],
  handleAddEvaluator,
  handleAddRestaurant,
}: AdminViewControlProps) {
  switch (type) {
    case "assignment":
      return (
        <div className="flex flex-col gap-3 sm:gap-4 w-full">
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
                    ? "Search by name, email, ID, phone, or specialty..."
                    : "Search by name, category, date, or evaluator..."
                }
                value={searchQuery || ""}
                onValueChange={(value) => {
                  if (setSearchQuery) {
                    setSearchQuery(value);
                  }
                }}
                className="w-full sm:w-[280px] md:w-[400px]"
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
              <Popover
                placement="bottom-start"
                offset={12}
                crossOffset={0}
                shouldFlip={false}
              >
                <PopoverTrigger>
                  <Button
                    className={`border-2 rounded-lg h-8 sm:h-10 px-3 font-semibold text-xs sm:text-sm transition-all relative overflow-visible ${
                      activeFiltersCount > 0
                        ? "bg-[#A67C37] text-white border-[#A67C37]"
                        : "bg-white text-[#A67C37] border-[#A67C37] hover:bg-[#A67C37] hover:text-white"
                    }`}
                    variant="flat"
                    startContent={<MdFilterList size={16} />}
                  >
                    {activeFiltersCount > 0 && (
                      <span className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 bg-[#A67C37] text-white text-xs w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center z-10 border-2 border-white">
                        {activeFiltersCount}
                      </span>
                    )}
                    <span className="hidden sm:inline">Filters</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[280px] sm:w-[320px] bg-white shadow-lg rounded-lg max-h-[70vh] overflow-hidden flex flex-col">
                  {/* Fixed Header */}
                  <div className="sticky top-0 bg-white z-10 px-4 pt-4 pb-3 border-b border-gray-200 w-full">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-sm sm:text-base text-black">
                        Filters
                      </span>
                      <button
                        onClick={clearFilters}
                        className={`text-sm flex items-center gap-1 transition-colors ${
                          activeFiltersCount > 0
                            ? "text-[#A67C37] hover:underline cursor-pointer"
                            : "text-gray-400 cursor-not-allowed"
                        }`}
                        disabled={activeFiltersCount === 0}
                      >
                        <MdClose size={14} />
                        Clear all
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto px-4 py-3">
                    <div className="flex flex-col gap-3 sm:gap-4 text-black">
                      {selectedView === "evaluator" ? (
                        /* Evaluator View Filters */
                        <>
                          {/* NDA Status Filter */}
                          <div className="flex flex-col gap-2">
                            <span className="font-medium text-xs sm:text-sm text-gray-700">
                              NDA Status
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {["Signed", "Pending", "Not Sent"].map(
                                (status) => (
                                  <Checkbox
                                    key={status}
                                    size="sm"
                                    isSelected={selectedNDAStatus?.includes(
                                      status
                                    )}
                                    onValueChange={() => {
                                      if (
                                        selectedNDAStatus &&
                                        setSelectedNDAStatus
                                      ) {
                                        const newStatus =
                                          selectedNDAStatus.includes(status)
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
                                )
                              )}
                            </div>
                          </div>

                          <Divider className="bg-gray-200" />

                          {/* Specialties Filter */}
                          {specialties && specialties.length > 0 && (
                            <>
                              <div className="flex flex-col gap-2">
                                <span className="font-medium text-xs sm:text-sm text-gray-700">
                                  Specialties
                                </span>
                                <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto">
                                  {specialties.map((specialty) => (
                                    <Checkbox
                                      key={specialty}
                                      size="sm"
                                      isSelected={selectedSpecialties?.includes(
                                        specialty
                                      )}
                                      onValueChange={() => {
                                        if (toggleSpecialty) {
                                          toggleSpecialty(specialty);
                                        }
                                      }}
                                      classNames={{
                                        label: "text-black text-xs sm:text-sm",
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

                          {/* Show Incomplete Only */}
                          <div className="flex items-center gap-2">
                            <Checkbox
                              size="sm"
                              isSelected={showIncompleteOnly || false}
                              onValueChange={() => {
                                if (setShowIncompleteOnly) {
                                  setShowIncompleteOnly(!showIncompleteOnly);
                                }
                              }}
                              classNames={{
                                label: "text-black text-xs sm:text-sm",
                              }}
                            >
                              Show Incomplete Only
                            </Checkbox>
                          </div>
                        </>
                      ) : (
                        /* Restaurant View Filters */
                        <>
                          {/* Assignment Date Range */}
                          <div className="flex flex-col gap-2">
                            <span className="font-medium text-xs sm:text-sm text-gray-700">
                              Assignment Date Range
                            </span>
                            <div className="flex flex-col gap-2">
                              <Input
                                type="date"
                                label="Start Date"
                                value={selectedDateRange?.start || ""}
                                onValueChange={(value) => {
                                  if (setSelectedDateRange) {
                                    setSelectedDateRange({
                                      start: value,
                                      end: selectedDateRange?.end || "",
                                    });
                                  }
                                }}
                                size="sm"
                                variant="bordered"
                                classNames={{
                                  inputWrapper:
                                    "bg-white border-gray-300 rounded-md",
                                  input: "text-black text-xs sm:text-sm",
                                }}
                              />
                              <Input
                                type="date"
                                label="End Date"
                                value={selectedDateRange?.end || ""}
                                onValueChange={(value) => {
                                  if (setSelectedDateRange) {
                                    setSelectedDateRange({
                                      start: selectedDateRange?.start || "",
                                      end: value,
                                    });
                                  }
                                }}
                                size="sm"
                                variant="bordered"
                                classNames={{
                                  inputWrapper:
                                    "bg-white border-gray-300 rounded-md",
                                  input: "text-black text-xs sm:text-sm",
                                }}
                              />
                            </div>
                          </div>

                          <Divider className="bg-gray-200" />

                          {/* Match Status Filter */}
                          <div className="flex flex-col gap-2">
                            <span className="font-medium text-xs sm:text-sm text-gray-700">
                              Match Status
                            </span>
                            <Tabs
                              size="sm"
                              aria-label="Match Status Filter"
                              selectedKey={selectedMatchStatus?.[0] ?? "all"}
                              onSelectionChange={(key) => {
                                if (setSelectedMatchStatus) {
                                  const nextKey = key as string;
                                  setSelectedMatchStatus(
                                    nextKey === "all" ? [] : [nextKey]
                                  );
                                }
                              }}
                              variant="bordered"
                              classNames={{
                                tabList: "p-1 bg-transparent",
                                tab: "h-7 hover:bg-[#A67C37] transition-colors",
                                tabContent:
                                  "group-data-[selected=true]:text-white text-gray-600 hover:text-white",
                                cursor: "bg-[#A67C37] shadow-md",
                              }}
                            >
                              <Tab key="all" title="All" />
                              <Tab key="Yes" title="Matched" />
                              <Tab key="No" title="Not Matched" />
                            </Tabs>
                          </div>
                          <Divider className="bg-gray-200" />

                          {/* Categories Filter */}
                          {categories && categories.length > 0 && (
                            <>
                              <div className="flex flex-col gap-2">
                                <span className="font-medium text-xs sm:text-sm text-gray-700">
                                  Categories
                                </span>
                                <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto overflow-x-hidden pr-1">
                                  {categories.map((category) => (
                                    <Checkbox
                                      key={category}
                                      size="sm"
                                      isSelected={selectedCategories?.includes(
                                        category
                                      )}
                                      onValueChange={() => {
                                        if (toggleCategory) {
                                          toggleCategory(category);
                                        }
                                      }}
                                      classNames={{
                                        label:
                                          "text-black text-xs sm:text-sm truncate",
                                      }}
                                    >
                                      {category}
                                    </Checkbox>
                                  ))}
                                </div>
                              </div>

                              <Divider className="bg-gray-200" />
                            </>
                          )}

                          {/* Evaluator 1 Progress */}
                          <div className="flex flex-col gap-2">
                            <span className="font-medium text-xs sm:text-sm text-gray-700">
                              Evaluator 1 Progress
                            </span>
                            <div className="flex flex-col gap-2">
                              {["Not Started", "In Progress", "Completed"].map(
                                (progress) => (
                                  <Checkbox
                                    key={`eva1-${progress}`}
                                    size="sm"
                                    isSelected={selectedEvaOneProgress?.includes(
                                      progress
                                    )}
                                    onValueChange={() => {
                                      if (toggleEvaOneProgress) {
                                        toggleEvaOneProgress(progress);
                                      }
                                    }}
                                    classNames={{
                                      label: "text-black text-xs sm:text-sm",
                                    }}
                                  >
                                    {progress}
                                  </Checkbox>
                                )
                              )}
                            </div>
                          </div>

                          <Divider className="bg-gray-200" />

                          {/* Evaluator 2 Progress */}
                          <div className="flex flex-col gap-2">
                            <span className="font-medium text-xs sm:text-sm text-gray-700">
                              Evaluator 2 Progress
                            </span>
                            <div className="flex flex-col gap-2">
                              {["Not Started", "In Progress", "Completed"].map(
                                (progress) => (
                                  <Checkbox
                                    key={`eva2-${progress}`}
                                    size="sm"
                                    isSelected={selectedEvaTwoProgress?.includes(
                                      progress
                                    )}
                                    onValueChange={() => {
                                      if (toggleEvaTwoProgress) {
                                        toggleEvaTwoProgress(progress);
                                      }
                                    }}
                                    classNames={{
                                      label: "text-black text-xs sm:text-sm",
                                    }}
                                  >
                                    {progress}
                                  </Checkbox>
                                )
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      <Divider className="bg-gray-200" />

                      {/* Rows Per Page Selector - Both Views */}
                      <div className="flex flex-col gap-2">
                        <span className="font-medium text-xs sm:text-sm text-gray-700">
                          Rows Per Page
                        </span>
                        <div className="flex gap-2">
                          {[10, 25, 50, 100].map((value) => (
                            <button
                              key={value}
                              onClick={() => {
                                if (setRowsPerPage) {
                                  setRowsPerPage(value);
                                }
                              }}
                              className={`px-2 py-1 text-xs rounded border transition-colors ${
                                rowsPerPage === value
                                  ? "bg-[#A67C37] text-white border-[#A67C37]"
                                  : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                              }`}
                            >
                              {value}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
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
              placeholder={
                type === "evaluator"
                  ? "Search by name, email, ID, phone, position, company or specialties..."
                  : "Search by name, address, category or remarks..."
              }
              className="w-full md:w-[450px]"
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
                  className={`border-2 rounded-lg h-8 sm:h-10 px-3 font-semibold text-xs sm:text-sm transition-all relative overflow-visible ${
                    activeFiltersCount > 0
                      ? "bg-[#A67C37] text-white border-[#A67C37]"
                      : "bg-white text-[#A67C37] border-[#A67C37] hover:bg-[#A67C37] hover:text-white"
                  }`}
                  variant="flat"
                  startContent={<MdFilterList size={16} />}
                >
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 bg-[#A67C37] text-white text-xs w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center z-10 border-2 border-white">
                      {activeFiltersCount}
                    </span>
                  )}
                  <span className="hidden sm:inline">Filters</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-full sm:w-[320px] bg-white shadow-lg rounded-lg max-h-[70vh] overflow-hidden flex flex-col">
                {/* Fixed Header */}
                <div className="sticky top-0 bg-white z-10 px-3 sm:px-4 pt-3 sm:pt-4 pb-3 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm sm:text-base text-black">
                      Filters
                    </span>
                    {activeFiltersCount > 0 && (
                      <button
                        onClick={clearFilters}
                        className="text-xs sm:text-sm text-[#A67C37] hover:underline flex items-center gap-1"
                      >
                        <MdClose size={14} />
                        Clear all
                      </button>
                    )}
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3">
                  <div className="flex flex-col gap-4 text-black">
                    {type === "evaluator" &&
                      specialties &&
                      specialties.length > 0 && (
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
                                  isSelected={selectedSpecialties?.includes(
                                    specialty
                                  )}
                                  onValueChange={() =>
                                    toggleSpecialty?.(specialty)
                                  }
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

                    {type === "restaurant" &&
                      categories &&
                      categories.length > 0 && (
                        <>
                          {/* Categories Filter */}
                          <div className="flex flex-col gap-2">
                            <span className="font-medium text-sm text-gray-700">
                              Category
                            </span>
                            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto overflow-x-hidden pr-1">
                              {categories.map((category) => (
                                <Checkbox
                                  key={category}
                                  size="sm"
                                  isSelected={selectedCategories?.includes(
                                    category
                                  )}
                                  onValueChange={() =>
                                    toggleCategory?.(category)
                                  }
                                  classNames={{
                                    label: "text-black text-sm truncate",
                                  }}
                                >
                                  {category}
                                </Checkbox>
                              ))}
                            </div>
                          </div>

                          <Divider className="bg-gray-200" />

                          {/* Rating Range Filter */}
                          <div className="flex flex-col gap-2">
                            <span className="font-medium text-sm text-gray-700">
                              Rating Range
                            </span>
                            <div className="flex gap-2 items-end">
                              <div className="flex-1">
                                <label className="text-xs text-gray-600">
                                  Min
                                </label>
                                <Input
                                  type="number"
                                  size="sm"
                                  min="0"
                                  max="5"
                                  step="0.1"
                                  value={ratingRange?.min.toString()}
                                  onValueChange={(val) => {
                                    if (setRatingRange && ratingRange) {
                                      setRatingRange({
                                        ...ratingRange,
                                        min: parseFloat(val) || 0,
                                      });
                                    }
                                  }}
                                  variant="bordered"
                                  classNames={{
                                    inputWrapper: "bg-white border-gray-300",
                                    input: "text-black text-sm",
                                  }}
                                />
                              </div>
                              <div className="flex-1">
                                <label className="text-xs text-gray-600">
                                  Max
                                </label>
                                <Input
                                  type="number"
                                  size="sm"
                                  min="0"
                                  max="5"
                                  step="0.1"
                                  value={ratingRange?.max.toString()}
                                  onValueChange={(val) => {
                                    if (setRatingRange && ratingRange) {
                                      setRatingRange({
                                        ...ratingRange,
                                        max: parseFloat(val) || 5,
                                      });
                                    }
                                  }}
                                  variant="bordered"
                                  classNames={{
                                    inputWrapper: "bg-white border-gray-300",
                                    input: "text-black text-sm",
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          <Divider className="bg-gray-200" />

                          {/* Budget Range Filter */}
                          <div className="flex flex-col gap-2">
                            <span className="font-medium text-sm text-gray-700">
                              Budget (MYR)
                            </span>
                            <div className="flex gap-2 items-end">
                              <div className="flex-1">
                                <label className="text-xs text-gray-600">
                                  Min
                                </label>
                                <Input
                                  type="number"
                                  size="sm"
                                  min="0"
                                  step="100"
                                  value={budgetRange?.min.toString()}
                                  onValueChange={(val) => {
                                    if (setBudgetRange && budgetRange) {
                                      setBudgetRange({
                                        ...budgetRange,
                                        min: parseFloat(val) || 0,
                                      });
                                    }
                                  }}
                                  variant="bordered"
                                  classNames={{
                                    inputWrapper: "bg-white border-gray-300",
                                    input: "text-black text-sm",
                                  }}
                                />
                              </div>
                              <div className="flex-1">
                                <label className="text-xs text-gray-600">
                                  Max
                                </label>
                                <Input
                                  type="number"
                                  size="sm"
                                  min="0"
                                  step="100"
                                  value={budgetRange?.max.toString()}
                                  onValueChange={(val) => {
                                    if (setBudgetRange && budgetRange) {
                                      setBudgetRange({
                                        ...budgetRange,
                                        max: parseFloat(val) || 10000,
                                      });
                                    }
                                  }}
                                  variant="bordered"
                                  classNames={{
                                    inputWrapper: "bg-white border-gray-300",
                                    input: "text-black text-sm",
                                  }}
                                />
                              </div>
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
                        <SelectItem
                          key="10"
                          value="10"
                          className="text-gray-600"
                        >
                          10
                        </SelectItem>
                        <SelectItem
                          key="25"
                          value="25"
                          className="text-gray-600"
                        >
                          25
                        </SelectItem>
                        <SelectItem
                          key="50"
                          value="50"
                          className="text-gray-600"
                        >
                          50
                        </SelectItem>
                        <SelectItem
                          key="100"
                          value="100"
                          className="text-gray-600"
                        >
                          100
                        </SelectItem>
                      </Select>
                    </div>
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

    case "budget":
      return (
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Search and Filter Row */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="flex flex-row gap-2 sm:gap-3 w-full sm:w-auto items-center">
              {/* Search Input */}
              <Input
                placeholder="Search by evaluator name, email, company, or restaurant..."
                value={searchQuery || ""}
                onValueChange={(value) => {
                  if (setSearchQuery) {
                    setSearchQuery(value);
                  }
                }}
                className="w-full sm:w-[280px] md:w-[400px]"
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
                    className={`border-2 rounded-lg h-8 sm:h-10 px-3 font-semibold text-xs sm:text-sm transition-all relative overflow-visible ${
                      activeFiltersCount > 0
                        ? "bg-[#A67C37] text-white border-[#A67C37]"
                        : "bg-white text-[#A67C37] border-[#A67C37] hover:bg-[#A67C37] hover:text-white"
                    }`}
                    variant="flat"
                    startContent={<MdFilterList size={16} />}
                  >
                    {activeFiltersCount > 0 && (
                      <span className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 bg-[#A67C37] text-white text-xs w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center z-10 border-2 border-white">
                        {activeFiltersCount}
                      </span>
                    )}
                    <span className="hidden sm:inline">Filters</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[280px] sm:w-[320px] bg-white shadow-lg rounded-lg max-h-[70vh] overflow-hidden flex flex-col">
                  {/* Fixed Header */}
                  <div className="sticky top-0 bg-white z-10 px-3 sm:px-4 pt-3 sm:pt-4 pb-3 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h4 className="text-base sm:text-lg font-semibold text-black">
                        Filters
                      </h4>
                      {activeFiltersCount > 0 && (
                        <button
                          onClick={clearFilters}
                          className="text-xs sm:text-sm text-red-500 hover:underline flex items-center gap-1"
                        >
                          <MdClose size={16} />
                          Clear All
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3">
                    <div className="space-y-4">
                      {/* Date Range Filter */}
                      <div className="flex flex-col gap-2">
                        <span className="font-medium text-sm text-gray-700">
                          Assignment Date Range
                        </span>
                        <div className="flex flex-col gap-2">
                          <Input
                            type="date"
                            label="Start Date"
                            value={selectedDateRange?.start || ""}
                            onValueChange={(value) => {
                              if (setSelectedDateRange) {
                                setSelectedDateRange({
                                  start: value,
                                  end: selectedDateRange?.end || "",
                                });
                              }
                            }}
                            size="sm"
                            variant="bordered"
                            classNames={{
                              inputWrapper:
                                "bg-white border-gray-300 rounded-md",
                              input: "text-black text-sm",
                            }}
                          />
                          <Input
                            type="date"
                            label="End Date"
                            value={selectedDateRange?.end || ""}
                            onValueChange={(value) => {
                              if (setSelectedDateRange) {
                                setSelectedDateRange({
                                  start: selectedDateRange?.start || "",
                                  end: value,
                                });
                              }
                            }}
                            size="sm"
                            variant="bordered"
                            classNames={{
                              inputWrapper:
                                "bg-white border-gray-300 rounded-md",
                              input: "text-black text-sm",
                            }}
                          />
                        </div>
                      </div>

                      <Divider className="bg-gray-200" />

                      {/* Rows Per Page Selector */}
                      <div className="flex flex-col gap-2">
                        <span className="font-medium text-sm text-gray-700">
                          Rows Per Page
                        </span>
                        <Select
                          selectedKeys={[rowsPerPage?.toString() || "10"]}
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
                          <SelectItem
                            key="10"
                            value="10"
                            className="text-gray-600"
                          >
                            10
                          </SelectItem>
                          <SelectItem
                            key="25"
                            value="25"
                            className="text-gray-600"
                          >
                            25
                          </SelectItem>
                          <SelectItem
                            key="50"
                            value="50"
                            className="text-gray-600"
                          >
                            50
                          </SelectItem>
                          <SelectItem
                            key="100"
                            value="100"
                            className="text-gray-600"
                          >
                            100
                          </SelectItem>
                        </Select>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}
