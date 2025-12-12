"use client";

import TableComponent from "@/components/table/Table";
import {
  Button,
  Checkbox,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pagination,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectItem,
  Tab,
  Tabs,
} from "@nextui-org/react";
import React, { useState } from "react";
import {
  MdClose,
  MdFilterList,
  MdLink,
  MdPeople,
  MdRestaurant,
  MdSearch,
  MdShuffle,
} from "react-icons/md";

// Columns for Evaluator View
const evaluatorColumns = [
  { name: "Eva ID", uid: "eva_id" },
  { name: "Name", uid: "name" },
  { name: "Email", uid: "email" },
  { name: "Phone", uid: "phone" },
  { name: "Specialty", uid: "specialty" },
  { name: "NDA Sent", uid: "nda_sent" },
  { name: "NDA Reminder", uid: "nda_reminder" },
  { name: "NDA Status", uid: "nda_status" },
  { name: "Rest. 1", uid: "restaurant_1" },
  { name: "Rest. 2", uid: "restaurant_2" },
  { name: "Total", uid: "total_restaurant" },
  { name: "Completed", uid: "restaurant_completed" },
  // { name: "Actions", uid: "actions" },
];

// Columns for Restaurant View
const restaurantColumns = [
  { name: "Name", uid: "name" },
  { name: "Category", uid: "category" },
  { name: "Matched", uid: "matched" },
  { name: "Date Assigned", uid: "date_assigned" },
  { name: "Evaluator 1", uid: "evaluator_1" },
  { name: "Eva 1 Done", uid: "completed_eva_1" },
  { name: "Evaluator 2", uid: "evaluator_2" },
  { name: "Eva 2 Done", uid: "completed_eva_2" },
  // { name: "Actions", uid: "actions" },
];

// Dummy data for Evaluator View
const evaluatorData = [
  {
    id: "1",
    eva_id: "EVA001",
    name: "Fajar Ramdani",
    email: "fajar@email.com",
    phone: "+60146111987",
    specialty: "Italian, Bakery",
    nda_sent: "2024-01-15",
    nda_reminder: "2024-01-20",
    nda_status: "Signed",
    restaurant_1: 3,
    restaurant_2: 4,
    total_restaurant: 8,
    restaurant_completed: 3,
  },
  {
    id: "2",
    eva_id: "EVA002",
    name: "Raihan Muhammad",
    email: "raihan@email.com",
    phone: "+60146112345",
    specialty: "Fast Food",
    nda_sent: "2024-01-16",
    nda_reminder: "-",
    nda_status: "Pending",
    restaurant_1: "Big Food",
    restaurant_2: "-",
    total_restaurant: 3,
    restaurant_completed: 1,
  },
  {
    id: "3",
    eva_id: "EVA003",
    name: "Ayunda Cinta",
    email: "ayunda@email.com",
    phone: "+60146119876",
    specialty: "Bakery, Pastry",
    nda_sent: "2024-01-17",
    nda_reminder: "2024-01-22",
    nda_status: "Not Sent",
    restaurant_1: "-",
    restaurant_2: "-",
    total_restaurant: 0,
    restaurant_completed: 0,
  },
  {
    id: "4",
    eva_id: "EVA004",
    name: "Putra Indika",
    email: "putra@email.com",
    phone: "+60146115678",
    specialty: "Asian Cuisine",
    nda_sent: "2024-01-18",
    nda_reminder: "-",
    nda_status: "Signed",
    restaurant_1: "Alina Bakery",
    restaurant_2: "Beriani Bonda",
    total_restaurant: 4,
    restaurant_completed: 4,
  },
];

// Dummy data for Restaurant View
const restaurantData = [
  {
    id: "1",
    name: "Adam's Kitchen - Taman Kota Masai",
    category: "Local Cuisine",
    matched: "Yes",
    date_assigned: "2024-01-15",
    evaluator_1: "Fajar Ramdani",
    completed_eva_1: "Yes",
    evaluator_2: "Raihan Muhammad",
    completed_eva_2: "No",
  },
  {
    id: "2",
    name: "ADS Corner's - Pusat Perdagangan",
    category: "Fast Food",
    matched: "Yes",
    date_assigned: "2024-01-16",
    evaluator_1: "Fajar Ramdani",
    completed_eva_1: "Yes",
    evaluator_2: "Putra Indika",
    completed_eva_2: "Yes",
  },
  {
    id: "3",
    name: "Alina Bakery",
    category: "Bakery",
    matched: "Yes",
    date_assigned: "2024-01-17",
    evaluator_1: "Putra Indika",
    completed_eva_1: "Yes",
    evaluator_2: "-",
    completed_eva_2: "-",
  },
  {
    id: "4",
    name: "Beriani Bonda House 1969",
    category: "Local Cuisine",
    matched: "No",
    date_assigned: "-",
    evaluator_1: "-",
    completed_eva_1: "-",
    evaluator_2: "-",
    completed_eva_2: "-",
  },
  {
    id: "5",
    name: "Big Food - Taman Nong Chik",
    category: "Fast Food",
    matched: "Partial",
    date_assigned: "2024-01-18",
    evaluator_1: "Raihan Muhammad",
    completed_eva_1: "No",
    evaluator_2: "-",
    completed_eva_2: "-",
  },
];

// Dummy evaluators list for manual matching
const evaluatorsList = [
  { id: "EVA001", name: "Fajar Ramdani" },
  { id: "EVA002", name: "Raihan Muhammad" },
  { id: "EVA003", name: "Ayunda Cinta" },
  { id: "EVA004", name: "Putra Indika" },
];

// Dummy restaurants list for manual matching
const restaurantsList = [
  { id: "REST001", name: "Adam's Kitchen" },
  { id: "REST002", name: "ADS Corner's" },
  { id: "REST003", name: "Alina Bakery" },
  { id: "REST004", name: "Beriani Bonda House 1969" },
  { id: "REST005", name: "Big Food" },
];

export default function AssignedPage() {
  const [selectedView, setSelectedView] = useState<string>("evaluator");
  const [page, setPage] = useState(1);
  const [selectedNDAStatus, setSelectedNDAStatus] = useState<string[]>([]);
  const [selectedMatchStatus, setSelectedMatchStatus] = useState<string[]>([]);
  const [isManualMatchOpen, setIsManualMatchOpen] = useState(false);
  const [selectedEvaluator, setSelectedEvaluator] = useState<string>("");
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("");

  // NDA status options
  const ndaStatuses = ["Signed", "Pending", "Not Sent"];
  const matchStatuses = ["Yes", "No", "Partial"];

  const toggleNDAStatus = (status: string) => {
    setSelectedNDAStatus((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const toggleMatchStatus = (status: string) => {
    setSelectedMatchStatus((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const clearFilters = () => {
    setSelectedNDAStatus([]);
    setSelectedMatchStatus([]);
  };

  const activeFiltersCount =
    selectedNDAStatus.length + selectedMatchStatus.length;

  const handleMatchEvaluator = () => {
    // TODO: Implement matchmaking algorithm
    console.log("Matchmaking algorithm triggered");
  };

  const handleManualMatch = () => {
    setIsManualMatchOpen(true);
  };

  const handleSaveManualMatch = () => {
    // TODO: Implement manual match save
    console.log("Manual match:", { selectedEvaluator, selectedRestaurant });
    setIsManualMatchOpen(false);
    setSelectedEvaluator("");
    setSelectedRestaurant("");
  };

  const handleSendReminder = (item: any) => {
    // TODO: Implement push notification reminder
    console.log("Sending reminder to:", item);
  };

  const handleViewDetails = (item: any) => {
    console.log("View details:", item);
  };

  const handleEdit = (item: any) => {
    console.log("Edit:", item);
  };

  return (
    <div className="text-black flex flex-col gap-4 lg:gap-6 p-4 sm:p-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <h2 className="text-xl sm:text-2xl font-bold uppercase">
          Assignment Management
        </h2>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Button
            className="bg-[#A67C37] text-white font-semibold rounded-lg text-sm sm:text-base"
            startContent={<MdShuffle size={18} />}
            onPress={handleMatchEvaluator}
            size="sm"
          >
            <span className="hidden sm:inline">Match Evaluator</span>
            <span className="sm:hidden">Match</span>
          </Button>
          <Button
            className="bg-white border-2 border-[#A67C37] text-[#A67C37] font-semibold rounded-lg text-sm sm:text-base"
            startContent={<MdLink size={18} />}
            onPress={handleManualMatch}
            size="sm"
          >
            <span className="hidden sm:inline">Manual Match</span>
            <span className="sm:hidden">Manual</span>
          </Button>
        </div>
      </div>

      {/* View Toggle & Search/Filter Section */}
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Modern Tab Toggle */}
        <div className="bg-gray-100 p-1 rounded-xl inline-flex w-full sm:w-fit">
          <Tabs
            selectedKey={selectedView}
            onSelectionChange={(key) => setSelectedView(key as string)}
            variant="light"
            classNames={{
              tabList: "gap-1 bg-transparent w-full",
              cursor: "bg-[#A67C37] shadow-md",
              tab: "px-3 sm:px-6 py-2 font-semibold flex-1 sm:flex-initial",
              tabContent:
                "group-data-[selected=true]:text-white text-gray-600 text-sm sm:text-base",
            }}
          >
            <Tab
              key="evaluator"
              title={
                <div className="flex items-center gap-1 sm:gap-2 justify-center" >
                  <MdPeople size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="hidden xs:inline">By Evaluator</span>
                  <span className="xs:hidden">Evaluator</span>
                </div>
              }
            />
            <Tab
              key="restaurant"
              title={
                <div className="flex items-center gap-1 sm:gap-2 justify-center">
                  <MdRestaurant size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="hidden xs:inline">By Restaurant</span>
                  <span className="xs:hidden">Restaurant</span>
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
                inputWrapper: "bg-white border-gray-300 rounded-md h-8 sm:h-10",
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
                        className="text-xs sm:text-sm text-[#A67C37] hover:underline flex items-center gap-1"
                      >
                        <MdClose
                          size={12}
                          className="sm:w-[14px] sm:h-[14px]"
                        />
                        Clear all
                      </button>
                    )}
                  </div>

                  <Divider className="bg-gray-200" />

                  {selectedView === "evaluator" ? (
                    /* NDA Status Filter for Evaluator View */
                    <div className="flex flex-col gap-2">
                      <span className="font-medium text-sm text-gray-700">
                        NDA Status
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {ndaStatuses.map((status) => (
                          <Checkbox
                            key={status}
                            size="sm"
                            isSelected={selectedNDAStatus.includes(status)}
                            onValueChange={() => toggleNDAStatus(status)}
                            classNames={{
                              label: "text-black text-sm",
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
                      <span className="font-medium text-sm text-gray-700">
                        Match Status
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {matchStatuses.map((status) => (
                          <Checkbox
                            key={status}
                            size="sm"
                            isSelected={selectedMatchStatus.includes(status)}
                            onValueChange={() => toggleMatchStatus(status)}
                            classNames={{
                              label: "text-black text-sm",
                            }}
                          >
                            {status}
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
          <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
            {selectedView === "evaluator" ? (
              <>
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-600 whitespace-nowrap">
                    <span className="hidden sm:inline">NDA Signed: </span>
                    <span className="sm:hidden">Signed: </span>2
                  </span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-gray-600 whitespace-nowrap">
                    Pending: 1
                  </span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
                  <span className="text-gray-600 whitespace-nowrap">
                    <span className="hidden sm:inline">Not Sent: </span>
                    <span className="sm:hidden">Unsent: </span>1
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-600 whitespace-nowrap">
                    Matched: 3
                  </span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-gray-600 whitespace-nowrap">
                    Partial: 1
                  </span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
                  <span className="text-gray-600 whitespace-nowrap">
                    <span className="hidden sm:inline">Unassigned: </span>
                    <span className="sm:hidden">None: </span>1
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          {selectedView === "evaluator" ? (
            <TableComponent
              columns={evaluatorColumns}
              data={evaluatorData}
              onView={handleViewDetails}
              onEdit={handleEdit}
              hideActions={false}
              renderCell={(item, columnKey) =>
                renderEvaluatorCell(item, columnKey, handleSendReminder)
              }
              emptyMessage={{
                title: "No evaluators assigned",
                description:
                  "Click 'Match Evaluator' to start assigning evaluators to restaurants.",
              }}
            />
          ) : (
            <TableComponent
              columns={restaurantColumns}
              data={restaurantData}
              onView={handleViewDetails}
              onEdit={handleEdit}
              hideActions={false}
              renderCell={renderRestaurantCell}
              emptyMessage={{
                title: "No restaurants assigned",
                description:
                  "Click 'Match Evaluator' to start assigning restaurants to evaluators.",
              }}
            />
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center mt-2 sm:mt-4">
        <div className="block lg:hidden">
          <Pagination
            isCompact
            showControls
            total={10}
            page={page}
            onChange={setPage}
            siblings={0}
            size="sm"
            classNames={{
              cursor: "bg-[#A67C37] text-white font-bold text-xs sm:text-sm",
              item: "text-xs sm:text-sm",
            }}
          />
        </div>
        <div className="hidden lg:block">
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

      {/* Manual Match Modal */}
      <Modal
        isOpen={isManualMatchOpen}
        onClose={() => setIsManualMatchOpen(false)}
        size="lg"
        className="mx-4"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-black uppercase font-bold">
                Manual Assignment
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-6">
                  <p className="text-gray-600 text-sm">
                    Manually assign an evaluator to a restaurant. Select the
                    evaluator and restaurant from the dropdowns below.
                  </p>

                  {/* Evaluator Selection */}
                  <div className="flex flex-col gap-2">
                    <label className="font-semibold text-sm text-gray-700">
                      Select Evaluator
                    </label>
                    <Select
                      placeholder="Choose an evaluator..."
                      selectedKeys={
                        selectedEvaluator ? [selectedEvaluator] : []
                      }
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        setSelectedEvaluator(selected);
                      }}
                      classNames={{
                        trigger: "bg-white border border-gray-300",
                        value: "text-black",
                      }}
                    >
                      {evaluatorsList.map((evaluator) => (
                        <SelectItem
                          key={evaluator.id}
                          textValue={evaluator.name}
                        >
                          <div className="flex flex-col">
                            <span className="text-black">{evaluator.name}</span>
                            <span className="text-xs text-gray-500">
                              {evaluator.id}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  {/* Restaurant Selection */}
                  <div className="flex flex-col gap-2">
                    <label className="font-semibold text-sm text-gray-700">
                      Select Restaurant
                    </label>
                    <Select
                      placeholder="Choose a restaurant..."
                      selectedKeys={
                        selectedRestaurant ? [selectedRestaurant] : []
                      }
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        setSelectedRestaurant(selected);
                      }}
                      classNames={{
                        trigger: "bg-white border border-gray-300",
                        value: "text-black",
                      }}
                    >
                      {restaurantsList.map((restaurant) => (
                        <SelectItem
                          key={restaurant.id}
                          textValue={restaurant.name}
                        >
                          <div className="flex flex-col">
                            <span className="text-black">
                              {restaurant.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {restaurant.id}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  {/* Info Box */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                      <strong>Note:</strong> Each restaurant can be assigned up
                      to 2 evaluators. Each evaluator can be assigned multiple
                      restaurants.
                    </p>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  className="bg-[#A67C37] text-white"
                  onPress={handleSaveManualMatch}
                  isDisabled={!selectedEvaluator || !selectedRestaurant}
                >
                  Assign
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

// Render cell function for Evaluator table
const renderEvaluatorCell = (
  item: any,
  columnKey: React.Key,
  onSendReminder: (item: any) => void
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

    case "nda_reminder":
      const isSigned = item.nda_status === "Signed";

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

      const isPending = item.nda_status === "Pending";
      const isNotSent = item.nda_status === "Not Sent";

      return (
        <div className="flex items-center justify-center">
          {isPending && (
            <button
              onClick={() => onSendReminder(item)}
              className="px-2 sm:px-3 py-1 sm:py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-xs font-medium shadow-sm flex items-center gap-1"
              title="Send NDA Reminder"
            >
              <span className="hidden sm:inline">🔔 Remind</span>
              <span className="sm:hidden">🔔</span>
            </button>
          )}
          {isNotSent && (
            <button
              onClick={() => onSendReminder(item)}
              className="px-2 sm:px-3 py-1 sm:py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs font-medium shadow-sm flex items-center gap-1"
              title="Send NDA Email"
            >
              <span className="hidden sm:inline">📧 Send NDA</span>
              <span className="sm:hidden">📧</span>
            </button>
          )}
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
              onClick={() => onSendReminder(item)}
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
const renderRestaurantCell = (item: any, columnKey: React.Key) => {
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
