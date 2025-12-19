// filepath: src/lib/adminPageUtils.ts
import Swal from "sweetalert2";


// Filter toggle functions
export const toggleNDAStatus = (
  status: string,
  selectedNDAStatus: string[],
  setSelectedNDAStatus: (statuses: string[]) => void
) => {
  setSelectedNDAStatus(
    selectedNDAStatus.includes(status)
      ? selectedNDAStatus.filter((s) => s !== status)
      : [...selectedNDAStatus, status]
  );
};

export const toggleMatchStatus = (
  status: string,
  selectedMatchStatus: string[],
  setSelectedMatchStatus: (statuses: string[]) => void
) => {
  setSelectedMatchStatus(
    selectedMatchStatus.includes(status)
      ? selectedMatchStatus.filter((s) => s !== status)
      : [...selectedMatchStatus, status]
  );
};

export const clearFilters = (
  setSelectedNDAStatus: (statuses: string[]) => void,
  setSelectedMatchStatus: (statuses: string[]) => void
) => {
  setSelectedNDAStatus([]);
  setSelectedMatchStatus([]);
};

export const getActiveFiltersCount = (
  selectedNDAStatus: string[],
  selectedMatchStatus: string[]
) => selectedNDAStatus.length + selectedMatchStatus.length;

// Data transformation functions (pure functions)
export const getEvaluatorViewData = (evaluators: any[], assignments: any[]) => {
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

export const getRestaurantViewData = (establishments: any[], assignments: any[], evaluators: any[]) => {
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

// Handler functions
export const handleMatchEvaluator = async (
  setIsLoading: (loading: boolean) => void,
  assignments: any[],
  establishments: any[],
  fetchData: () => Promise<void>
) => {
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

export const handleManualMatch = (setIsManualMatchOpen: (open: boolean) => void) => {
  setIsManualMatchOpen(true);
};

export const handleSaveManualMatch = async (
  selectedEvaluator: string,
  selectedRestaurant: string,
  establishments: any[],
  evaluators: any[],
  assignments: any[],
  setIsLoading: (loading: boolean) => void,
  fetchData: () => Promise<void>,
  setIsManualMatchOpen: (open: boolean) => void,
  setSelectedEvaluator: (id: string) => void,
  setSelectedRestaurant: (id: string) => void
) => {
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

export const handleSendNDAEmail = (evaluator: any) => {
  // TODO: Implement NDA email sending
  console.log("Sending NDA email to:", evaluator.name);
  // Call API: await sendNDAEmail(evaluator.eva_id);
};

export const handleSendNDAReminder = (evaluator: any) => {
  // TODO: Implement NDA reminder
  console.log("Sending NDA reminder to:", evaluator.name);
  // Call API: await sendNdaReminder(evaluator.eva_id);
};

export const handleSendCompletionReminder = (evaluator: any) => {
  // TODO: Implement completion reminder
  console.log("Sending completion reminder to:", evaluator.name);
  // Call API: await sendCompletionReminder({ evaluatorId: evaluator.eva_id });
};

export const handleViewDetails = (item: any) => {
  console.log("View details:", item);
};

export const handleEdit = (
  item: any,
  selectedView: string,
  assignments: any[],
  setEditingRestaurant: (restaurant: any) => void,
  setEditEvaluator1: (id: string) => void,
  setEditEvaluator2: (id: string) => void,
  setIsEditModalOpen: (open: boolean) => void
) => {
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

export const handleSaveEdit = async (
  editingRestaurant: any,
  editEvaluator1: string,
  editEvaluator2: string,
  assignments: any[],
  establishments: any[],
  evaluators: any[],
  setIsLoading: (loading: boolean) => void,
  fetchData: () => Promise<void>,
  setIsEditModalOpen: (open: boolean) => void,
  setEditingRestaurant: (restaurant: any) => void,
  setEditEvaluator1: (id: string) => void,
  setEditEvaluator2: (id: string) => void
) => {
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