"use client";

import TableComponent from "@/components/table/Table";
import {
  evaluatorColumns,
  matchStatuses,
  ndaStatuses,
  restaurantColumns,
} from "@/constants/assignedData";
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
import React, { useEffect, useState } from "react";
import {
  MdClose,
  MdFilterList,
  MdLink,
  MdPeople,
  MdRestaurant,
  MdSearch,
  MdShuffle,
} from "react-icons/md";
import Swal from "sweetalert2";

/* TODO: Implement API helpers - See guidance below
 * 1. Data fetching: src/lib/api/assignments.ts
 *    - fetchAssignments(), fetchEvaluators(), fetchRestaurants()
 * 2. Manual assignment: assignEvaluatorToRestaurant()
 * 3. Notifications: src/lib/notifications.ts
 *    - sendNDAEmail(), sendNdaReminder(), sendCompletionReminder()
 */

export default function AssignedPage() {
  const [selectedView, setSelectedView] = useState<string>("evaluator");
  const [page, setPage] = useState(1);
  const [selectedNDAStatus, setSelectedNDAStatus] = useState<string[]>([]);
  const [selectedMatchStatus, setSelectedMatchStatus] = useState<string[]>([]);
  const [isManualMatchOpen, setIsManualMatchOpen] = useState(false);
  const [selectedEvaluator, setSelectedEvaluator] = useState<string>("");
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [evaluators, setEvaluators] = useState<any[]>([]);
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<any>(null);
  const [editEvaluator1, setEditEvaluator1] = useState<string>("");
  const [editEvaluator2, setEditEvaluator2] = useState<string>("");

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [assignmentsRes, evaluatorsRes, establishmentsRes] =
        await Promise.all([
          fetch("/api/assignments?includeDetails=true"),
          fetch("/api/evaluators"),
          fetch("/api/establishments"),
        ]);

      const assignmentsData = await assignmentsRes.json();
      const evaluatorsData = await evaluatorsRes.json();
      const establishmentsData = await establishmentsRes.json();

      setAssignments(assignmentsData.assignments || []);
      setEvaluators(evaluatorsData.evaluators || []);
      setEstablishments(establishmentsData.establishments || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      await Swal.fire({
        icon: "error",
        title: "Failed to Load Data",
        text: "Unable to fetch assignments data. Please refresh the page.",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  // Transform assignments data for evaluator view
  const getEvaluatorViewData = () => {
    if (!evaluators || evaluators.length === 0) return [];

    const evaluatorMap = new Map();

    evaluators.forEach((evaluator) => {
      const evaluatorAssignments = assignments.filter(
        (a) =>
          a.evaluator1Id === evaluator.id || a.evaluator2Id === evaluator.id
      );

      const totalRestaurants = evaluatorAssignments.length;
      const completedRestaurants = evaluatorAssignments.filter(
        (a) => a.status === "completed"
      ).length;

      // TODO: Get real NDA status from evaluator record
      const ndaStatus = evaluator.ndaStatus || "Not Sent";

      // Handle specialties - could be array or string
      const specialtyDisplay = Array.isArray(evaluator.specialties)
        ? evaluator.specialties.join(", ")
        : evaluator.specialties || "";

      evaluatorMap.set(evaluator.id, {
        id: evaluator.id, // Required by Table component
        key: evaluator.id, // Add key for table
        eva_id: evaluator.id,
        name: evaluator.name,
        email: evaluator.email || "",
        phone: evaluator.phone || "",
        specialty: specialtyDisplay,
        nda_status: ndaStatus,
        total_restaurant: totalRestaurants,
        restaurant_completed: completedRestaurants,
      });
    });

    return Array.from(evaluatorMap.values());
  };

  // Transform assignments data for restaurant view
  const getRestaurantViewData = () => {
    if (!establishments || establishments.length === 0) return [];

    return establishments.map((establishment) => {
      const assignment = assignments.find(
        (a) => a.establishmentId === establishment.id
      );

      if (!assignment) {
        return {
          id: establishment.id, // Required by Table component
          key: establishment.id, // Add key for table
          res_id: establishment.id,
          name: establishment.name,
          category: establishment.category,
          matched: "No",
          date_assigned: "-",
          evaluator_1: "-",
          evaluator_2: "-",
          completed_eva_1: "-",
          completed_eva_2: "-",
        };
      }

      const evaluator1 = evaluators.find(
        (e) => e.id === assignment.evaluator1Id
      );
      const evaluator2 = evaluators.find(
        (e) => e.id === assignment.evaluator2Id
      );

      return {
        id: establishment.id, // Required by Table component
        key: establishment.id, // Add key for table
        res_id: establishment.id,
        name: establishment.name,
        category: establishment.category,
        matched: "Yes",
        date_assigned: new Date(assignment.assignedAt).toLocaleDateString(),
        evaluator_1: evaluator1?.name || "-",
        evaluator_2: evaluator2?.name || "-",
        completed_eva_1: assignment.status === "completed" ? "Yes" : "No",
        completed_eva_2: assignment.status === "completed" ? "Yes" : "No",
      };
    });
  };

  const evaluatorViewData = getEvaluatorViewData();
  const restaurantViewData = getRestaurantViewData();

  const handleMatchEvaluator = async () => {
    try {
      setIsLoading(true);

      // Find unassigned restaurants
      const assignedEstablishmentIds = assignments.map(
        (a) => a.establishmentId
      );
      const unassignedEstablishments = establishments.filter(
        (est) => !assignedEstablishmentIds.includes(est.id)
      );

      if (unassignedEstablishments.length === 0) {
        await Swal.fire({
          icon: "info",
          title: "No Unassigned Restaurants",
          text: "All restaurants have been assigned to evaluators.",
        });
        return;
      }

      // Auto-assign each unassigned restaurant
      const results = await Promise.allSettled(
        unassignedEstablishments.map((establishment) =>
          fetch("/api/assignments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ establishmentId: establishment.id }),
          }).then((res) => res.json())
        )
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      await Swal.fire({
        icon: successful > 0 ? "success" : "error",
        title: "Auto-Assignment Complete",
        html: `
          <p><strong>Successfully assigned:</strong> ${successful} restaurants</p>
          ${failed > 0 ? `<p><strong>Failed:</strong> ${failed} restaurants</p>` : ""}
        `,
      });

      // Refresh data
      await fetchData();
    } catch (error) {
      console.error("Error in auto-assignment:", error);
      await Swal.fire({
        icon: "error",
        title: "Assignment Failed",
        text: "An error occurred during auto-assignment.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualMatch = () => {
    setIsManualMatchOpen(true);
  };

  const handleSaveManualMatch = async () => {
    if (!selectedEvaluator || !selectedRestaurant) return;

    try {
      setIsLoading(true);

      // Get the restaurant details
      const restaurant = establishments.find(
        (e) => e.id === selectedRestaurant
      );
      const evaluator = evaluators.find((e) => e.id === selectedEvaluator);

      if (!restaurant || !evaluator) {
        throw new Error("Restaurant or evaluator not found");
      }

      // Check if evaluator specialty matches restaurant category
      if (!evaluator.specialties.includes(restaurant.category)) {
        await Swal.fire({
          icon: "error",
          title: "Specialty Mismatch",
          text: `Evaluator ${evaluator.name} does not have specialty "${restaurant.category}" required for ${restaurant.name}.`,
        });
        return;
      }

      // Check if restaurant already has assignments
      const existingAssignments = assignments.filter(
        (a) => a.establishmentId === selectedRestaurant
      );

      if (existingAssignments.length > 0) {
        const assignment = existingAssignments[0];

        // Check if this evaluator is already assigned
        if (
          assignment.evaluator1Id === selectedEvaluator ||
          assignment.evaluator2Id === selectedEvaluator
        ) {
          await Swal.fire({
            icon: "warning",
            title: "Already Assigned",
            text: `${evaluator.name} is already assigned to ${restaurant.name}.`,
          });
          return;
        }

        // If restaurant has 2 evaluators, show error
        if (assignment.evaluator1Id && assignment.evaluator2Id) {
          await Swal.fire({
            icon: "warning",
            title: "Maximum Evaluators Reached",
            text: `${restaurant.name} already has 2 evaluators assigned.`,
          });
          return;
        }
      }

      // Create new assignment (API will auto-select second evaluator if available)
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          establishmentId: selectedRestaurant,
          evaluator1Id: selectedEvaluator,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create assignment");
      }

      await Swal.fire({
        icon: "success",
        title: "Assignment Created",
        text: `Successfully assigned ${evaluator.name} to ${restaurant.name}.`,
      });

      // Refresh data
      await fetchData();
      setIsManualMatchOpen(false);
      setSelectedEvaluator("");
      setSelectedRestaurant("");
    } catch (error: any) {
      console.error("Error in manual assignment:", error);
      await Swal.fire({
        icon: "error",
        title: "Assignment Failed",
        text: error.message || "An error occurred during assignment.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Clean handler functions similar to evaluators/restaurants pages
  const handleSendNDAEmail = (evaluator: any) => {
    // TODO: Implement NDA email sending
    console.log("Sending NDA email to:", evaluator.name);
    // Call API: await sendNDAEmail(evaluator.eva_id);
  };

  const handleSendNDAReminder = (evaluator: any) => {
    // TODO: Implement NDA reminder
    console.log("Sending NDA reminder to:", evaluator.name);
    // Call API: await sendNdaReminder(evaluator.eva_id);
  };

  const handleSendCompletionReminder = (evaluator: any) => {
    // TODO: Implement completion reminder
    console.log("Sending completion reminder to:", evaluator.name);
    // Call API: await sendCompletionReminder({ evaluatorId: evaluator.eva_id });
  };

  const handleViewDetails = (item: any) => {
    console.log("View details:", item);
  };

  const handleEdit = (item: any) => {
    if (selectedView === "restaurant") {
      // Find the assignment for this restaurant
      const assignment = assignments.find(
        (a) => a.establishmentId === item.res_id
      );

      setEditingRestaurant(item);
      setEditEvaluator1(assignment?.evaluator1Id || "");
      setEditEvaluator2(assignment?.evaluator2Id || "");
      setIsEditModalOpen(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingRestaurant) return;

    try {
      setIsLoading(true);

      // Find the existing assignment
      const assignment = assignments.find(
        (a) => a.establishmentId === editingRestaurant.res_id
      );

      if (!assignment) {
        await Swal.fire({
          icon: "error",
          title: "No Assignment Found",
          text: "This restaurant doesn't have an assignment to edit.",
        });
        return;
      }

      // Validate specialty matches
      const restaurant = establishments.find(
        (e) => e.id === editingRestaurant.res_id
      );

      if (editEvaluator1) {
        const evaluator1 = evaluators.find((e) => e.id === editEvaluator1);
        if (
          evaluator1 &&
          !evaluator1.specialties.includes(restaurant?.category)
        ) {
          await Swal.fire({
            icon: "error",
            title: "Specialty Mismatch",
            text: `Evaluator 1 (${evaluator1.name}) does not have specialty "${restaurant?.category}".`,
          });
          return;
        }
      }

      if (editEvaluator2) {
        const evaluator2 = evaluators.find((e) => e.id === editEvaluator2);
        if (
          evaluator2 &&
          !evaluator2.specialties.includes(restaurant?.category)
        ) {
          await Swal.fire({
            icon: "error",
            title: "Specialty Mismatch",
            text: `Evaluator 2 (${evaluator2.name}) does not have specialty "${restaurant?.category}".`,
          });
          return;
        }
      }

      // If both evaluators are removed, delete the assignment
      if (!editEvaluator1 && !editEvaluator2) {
        const response = await fetch(`/api/assignments/${assignment.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete assignment");
        }

        await Swal.fire({
          icon: "success",
          title: "Assignment Removed",
          text: `Successfully removed all evaluators from ${editingRestaurant.name}.`,
        });
      } else {
        // Update the assignment
        const response = await fetch(`/api/assignments/${assignment.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            evaluator1Id: editEvaluator1 || null,
            evaluator2Id: editEvaluator2 || null,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update assignment");
        }

        await Swal.fire({
          icon: "success",
          title: "Assignment Updated",
          text: `Successfully updated evaluators for ${editingRestaurant.name}.`,
        });
      }

      // Refresh data
      await fetchData();
      setIsEditModalOpen(false);
      setEditingRestaurant(null);
      setEditEvaluator1("");
      setEditEvaluator2("");
    } catch (error: any) {
      console.error("Error updating assignment:", error);
      await Swal.fire({
        icon: "error",
        title: "Update Failed",
        text:
          error.message || "An error occurred while updating the assignment.",
      });
    } finally {
      setIsLoading(false);
    }
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
        <div className="bg-gray-100 p-1 rounded-xl flex w-full sm:w-fit">
          <Tabs
            selectedKey={selectedView}
            onSelectionChange={(key) => setSelectedView(key as string)}
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
          {(evaluatorViewData.length > 0 || restaurantViewData.length > 0) && (
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

      {/* Table Section */}
      <div className="bg-white rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A67C37]"></div>
            </div>
          ) : selectedView === "evaluator" ? (
            <TableComponent
              columns={evaluatorColumns}
              data={evaluatorViewData}
              onView={handleViewDetails}
              onEdit={handleEdit}
              hideActions={true}
              renderCell={(item, columnKey) =>
                renderEvaluatorCell(item, columnKey, {
                  onSendNDAEmail: handleSendNDAEmail,
                  onSendNDAReminder: handleSendNDAReminder,
                  onSendCompletionReminder: handleSendCompletionReminder,
                })
              }
              emptyMessage={{
                title:
                  evaluators.length === 0
                    ? "No evaluators yet"
                    : "No assignments yet",
                description:
                  evaluators.length === 0
                    ? "Add evaluators first in the Evaluators page."
                    : "Click 'Match Evaluator' to start assigning evaluators to restaurants.",
              }}
            />
          ) : (
            <TableComponent
              columns={restaurantColumns}
              data={restaurantViewData}
              onEdit={handleEdit}
              hideActions={false}
              renderCell={(item, columnKey) => {
                // Let default handler manage actions
                if (columnKey === "actions") {
                  return undefined;
                }
                return renderRestaurantCell(item, columnKey);
              }}
              emptyMessage={{
                title:
                  establishments.length === 0
                    ? "No restaurants yet"
                    : "No assignments yet",
                description:
                  establishments.length === 0
                    ? "Add restaurants first in the Restaurants page."
                    : "Click 'Match Evaluator' to start assigning restaurants to evaluators.",
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
                      {evaluators.map((evaluator) => (
                        <SelectItem
                          key={evaluator.id}
                          textValue={evaluator.name}
                        >
                          <div className="flex flex-col">
                            <span className="text-black">{evaluator.name}</span>
                            <span className="text-xs text-gray-500">
                              {Array.isArray(evaluator.specialties)
                                ? evaluator.specialties.join(", ")
                                : evaluator.specialties || "No specialty"}
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
                      {establishments.map((restaurant) => (
                        <SelectItem
                          key={restaurant.id}
                          textValue={restaurant.name}
                        >
                          <div className="flex flex-col">
                            <span className="text-black">
                              {restaurant.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {restaurant.category}
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

      {/* Edit Assignment Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingRestaurant(null);
          setEditEvaluator1("");
          setEditEvaluator2("");
        }}
        size="lg"
        className="mx-4"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-black uppercase font-bold">
                Edit Assignment - {editingRestaurant?.name}
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-6">
                  <p className="text-gray-600 text-sm">
                    Reassign or remove evaluators from this restaurant. Leave a
                    field empty to remove that evaluator. Clear both to delete
                    the assignment entirely.
                  </p>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                    <strong>Restaurant Category:</strong>{" "}
                    {editingRestaurant?.category}
                  </div>

                  {/* Evaluator 1 Selection */}
                  <div className="flex flex-col gap-2">
                    <label className="font-semibold text-sm text-gray-700">
                      Evaluator 1
                    </label>
                    <Select
                      placeholder="Select evaluator 1 or leave empty"
                      selectedKeys={editEvaluator1 ? [editEvaluator1] : []}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0];
                        setEditEvaluator1(selected ? String(selected) : "");
                      }}
                      variant="bordered"
                      classNames={{
                        trigger: "bg-white border-gray-300",
                        value: "text-black",
                      }}
                    >
                      {evaluators
                        .filter((e) =>
                          e.specialties.includes(editingRestaurant?.category)
                        )
                        .map((evaluator) => (
                          <SelectItem
                            key={evaluator.id}
                            value={evaluator.id}
                            textValue={evaluator.name}
                            className="text-black"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {evaluator.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {Array.isArray(evaluator.specialties)
                                  ? evaluator.specialties.join(", ")
                                  : evaluator.specialties}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                    </Select>
                    {editEvaluator1 && (
                      <Button
                        size="sm"
                        color="danger"
                        variant="flat"
                        onPress={() => setEditEvaluator1("")}
                        startContent={<MdClose size={16} />}
                      >
                        Remove Evaluator 1
                      </Button>
                    )}
                  </div>

                  {/* Evaluator 2 Selection */}
                  <div className="flex flex-col gap-2">
                    <label className="font-semibold text-sm text-gray-700">
                      Evaluator 2
                    </label>
                    <Select
                      placeholder="Select evaluator 2 or leave empty"
                      selectedKeys={editEvaluator2 ? [editEvaluator2] : []}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0];
                        setEditEvaluator2(selected ? String(selected) : "");
                      }}
                      variant="bordered"
                      classNames={{
                        trigger: "bg-white border-gray-300",
                        value: "text-black",
                      }}
                    >
                      {evaluators
                        .filter(
                          (e) =>
                            e.specialties.includes(
                              editingRestaurant?.category
                            ) && e.id !== editEvaluator1
                        )
                        .map((evaluator) => (
                          <SelectItem
                            key={evaluator.id}
                            value={evaluator.id}
                            textValue={evaluator.name}
                            className="text-black"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {evaluator.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {Array.isArray(evaluator.specialties)
                                  ? evaluator.specialties.join(", ")
                                  : evaluator.specialties}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                    </Select>
                    {editEvaluator2 && (
                      <Button
                        size="sm"
                        color="danger"
                        variant="flat"
                        onPress={() => setEditEvaluator2("")}
                        startContent={<MdClose size={16} />}
                      >
                        Remove Evaluator 2
                      </Button>
                    )}
                  </div>

                  {!editEvaluator1 && !editEvaluator2 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                      ⚠️ Both evaluators are empty. This will delete the entire
                      assignment.
                    </div>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  className="bg-[#A67C37] text-white"
                  onPress={handleSaveEdit}
                  isLoading={isLoading}
                >
                  {!editEvaluator1 && !editEvaluator2
                    ? "Delete Assignment"
                    : "Update Assignment"}
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
  handlers: {
    onSendNDAEmail: (item: any) => void;
    onSendNDAReminder: (item: any) => void;
    onSendCompletionReminder: (item: any) => void;
  }
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

    case "nda_sent":
      const isNotSent = item.nda_status === "Not Sent";

      if (!isNotSent) {
        return (
          <div className="flex items-center justify-center">
            <div className="px-2 sm:px-3 py-1 sm:py-2 bg-gray-100 text-gray-500 rounded-lg border border-gray-200 text-xs font-medium">
              <span className="hidden sm:inline">✓ Sent</span>
              <span className="sm:hidden">✓</span>
            </div>
          </div>
        );
      }

      return (
        <div className="flex items-center justify-center">
          <button
            onClick={() => handlers.onSendNDAEmail(item)}
            className="px-2 sm:px-3 py-1 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs font-medium shadow-sm flex items-center gap-1"
            title="Send NDA Email"
          >
            <span className="hidden sm:inline">📧 Send NDA</span>
            <span className="sm:hidden">📧</span>
          </button>
        </div>
      );

    case "nda_reminder":
      const isSigned = item.nda_status === "Signed";
      const isPending = item.nda_status === "Pending";

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

      if (!isPending) {
        return (
          <div className="flex items-center justify-center">
            <div className="px-2 sm:px-3 py-1 sm:py-2 bg-gray-100 text-gray-400 rounded-lg border border-gray-200 text-xs font-medium">
              <span className="hidden sm:inline">—</span>
              <span className="sm:hidden">—</span>
            </div>
          </div>
        );
      }

      return (
        <div className="flex items-center justify-center">
          <button
            onClick={() => handlers.onSendNDAReminder(item)}
            className="px-2 sm:px-3 py-1 sm:py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-xs font-medium shadow-sm flex items-center gap-1"
            title="Send NDA Reminder"
          >
            <span className="hidden sm:inline">� Send Reminder</span>
            <span className="sm:hidden">�</span>
          </button>
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
              onClick={() => handlers.onSendCompletionReminder(item)}
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
