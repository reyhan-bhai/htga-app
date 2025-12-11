"use client";

import TableComponent from "@/components/table/Table";
import {
  Button,
  Checkbox,
  Chip,
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
  Tooltip,
} from "@nextui-org/react";
import React, { useState } from "react";
import {
  MdClose,
  MdFilterList,
  MdLink,
  MdNotifications,
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
    <div className="text-black flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold uppercase">Assignment Management</h2>

        {/* Action Buttons */}
        <div className="flex flex-row gap-3">
          <Button
            className="bg-[#A67C37] text-white font-semibold rounded-lg"
            startContent={<MdShuffle size={20} />}
            onPress={handleMatchEvaluator}
          >
            Match Evaluator
          </Button>
          <Button
            className="bg-white border-2 border-[#A67C37] text-[#A67C37] font-semibold rounded-lg"
            startContent={<MdLink size={20} />}
            onPress={handleManualMatch}
          >
            Manual Match
          </Button>
        </div>
      </div>

      {/* View Toggle & Search/Filter Section */}
      <div className="flex flex-col gap-4">
        {/* Modern Tab Toggle */}
        <div className="bg-gray-100 p-1 rounded-xl inline-flex w-fit">
          <Tabs
            selectedKey={selectedView}
            onSelectionChange={(key) => setSelectedView(key as string)}
            variant="light"
            classNames={{
              tabList: "gap-1 bg-transparent",
              cursor: "bg-[#A67C37] shadow-md",
              tab: "px-6 py-2 font-semibold",
              tabContent: "group-data-[selected=true]:text-white text-gray-600",
            }}
          >
            <Tab
              key="evaluator"
              title={
                <div className="flex items-center gap-2">
                  <MdPeople size={18} />
                  <span>By Evaluator</span>
                </div>
              }
            />
            <Tab
              key="restaurant"
              title={
                <div className="flex items-center gap-2">
                  <MdRestaurant size={18} />
                  <span>By Restaurant</span>
                </div>
              }
            />
          </Tabs>
        </div>

        {/* Search and Filter Row */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
          <div className="flex flex-row gap-3 w-full md:w-auto items-center">
            {/* Search Input */}
            <Input
              placeholder={
                selectedView === "evaluator"
                  ? "Search by name, email, ID..."
                  : "Search by restaurant name, category..."
              }
              className="w-full md:w-[350px]"
              size="sm"
              variant="bordered"
              startContent={<MdSearch className="text-black" size={18} />}
              classNames={{
                inputWrapper: "bg-white border-gray-300 rounded-md",
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
          <div className="flex gap-4 text-sm">
            {selectedView === "evaluator" ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-600">NDA Signed: 2</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-gray-600">Pending: 1</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-gray-600">Not Sent: 1</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-600">Matched: 3</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-gray-600">Partial: 1</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-gray-600">Unassigned: 1</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg overflow-x-auto">
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

      {/* Pagination */}
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

      {/* Manual Match Modal */}
      <Modal
        isOpen={isManualMatchOpen}
        onClose={() => setIsManualMatchOpen(false)}
        size="lg"
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
      return (
        <Chip
          size="sm"
          color={
            value === "Signed"
              ? "success"
              : value === "Pending"
                ? "warning"
                : "danger"
          }
          variant="flat"
        >
          {value}
        </Chip>
      );
    case "nda_reminder":
      return (
        <div className="flex items-center gap-2">
          <span className="text-xs">{value}</span>
          {item.nda_status !== "Signed" && (
            <Tooltip className="text-black" content="Send NDA Reminder via Push Notification">
              <button
                onClick={() => onSendReminder(item)}
                className="text-[#A67C37] hover:text-[#8B6930] transition-colors"
              >
                <MdNotifications size={18} />
              </button>
            </Tooltip>
          )}
        </div>
      );
    case "restaurant_completed":
      const total = item.total_restaurant;
      const completed = item.restaurant_completed;
      const progressColor =
        completed === total && total > 0
          ? "text-green-600"
          : completed > 0
            ? "text-yellow-600"
            : "text-gray-500";
      return (
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${progressColor}`}>
            {completed}/{total}
          </span>
          {completed < total && total > 0 && (
            <Tooltip className="text-black" content="Send Completion Reminder">
              <button
                onClick={() => onSendReminder(item)}
                className="text-[#A67C37] hover:text-[#8B6930] transition-colors"
              >
                <MdNotifications size={16} />
              </button>
            </Tooltip>
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
      return (
        <Chip
          size="sm"
          color={
            value === "Yes"
              ? "success"
              : value === "Partial"
                ? "warning"
                : "danger"
          }
          variant="flat"
        >
          {value}
        </Chip>
      );
    case "completed_eva_1":
    case "completed_eva_2":
      if (value === "-") return <span className="text-gray-400">{value}</span>;
      return (
        <Chip
          size="sm"
          color={value === "Yes" ? "success" : "warning"}
          variant="flat"
        >
          {value === "Yes" ? "Done" : "Pending"}
        </Chip>
      );
    default:
      return value;
  }
};
