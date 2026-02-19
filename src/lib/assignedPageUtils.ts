// filepath: src/lib/adminPageUtils.ts
import Swal from "sweetalert2";

// Filter toggle functions
export const toggleNDAStatus = (
  status: string,
  selectedNDAStatus: string[],
  setSelectedNDAStatus: (statuses: string[]) => void,
) => {
  setSelectedNDAStatus(
    selectedNDAStatus.includes(status)
      ? selectedNDAStatus.filter((s) => s !== status)
      : [...selectedNDAStatus, status],
  );
};

export const toggleMatchStatus = (
  status: string,
  selectedMatchStatus: string[],
  setSelectedMatchStatus: (statuses: string[]) => void,
) => {
  setSelectedMatchStatus(
    selectedMatchStatus.includes(status)
      ? selectedMatchStatus.filter((s) => s !== status)
      : [...selectedMatchStatus, status],
  );
};

export const clearFilters = (
  setSelectedNDAStatus: (statuses: string[]) => void,
  setSelectedMatchStatus: (statuses: string[]) => void,
) => {
  setSelectedNDAStatus([]);
  setSelectedMatchStatus([]);
};

export const getActiveFiltersCount = (
  selectedNDAStatus: string[],
  selectedMatchStatus: string[],
) => selectedNDAStatus.length + selectedMatchStatus.length;

// Data transformation functions (pure functions)
export const getEvaluatorViewData = (evaluators: any[], assignments: any[]) => {
  // Add dummy evaluators for testing NDA statuses
  // const dummyEvaluators = [
  //   {
  //     id: "dummy-1",
  //     name: "John Doe (Dummy - Pending)",
  //     email: "john.doe@example.com",
  //     ndaStatus: "Pending",  // Note: Use "ndaStatus" to match the evaluator object structure
  //     specialties: ["Italian", "Mexican"],
  //     assignments: [],  // Mock assignments if needed
  //   },
  //   {
  //     id: "dummy-2",
  //     name: "Jane Smith (Dummy - Completed)",
  //     email: "jane.smith@example.com",
  //     ndaStatus: "Signed",  // Assuming "Completed" maps to "Signed" in the UI (adjust if needed)
  //     specialties: ["Chinese", "Japanese"],
  //     assignments: [],
  //   },
  //   // Add more dummies as needed (e.g., for "Not Sent")
  //   {
  //     id: "dummy-3",
  //     name: "Bob Wilson (Dummy - Not Sent)",
  //     email: "bob.wilson@example.com",
  //     ndaStatus: "Not Sent",
  //     specialties: ["French"],
  //     assignments: [],
  //   },
  // ];

  const allEvaluators = [...evaluators];

  if (!allEvaluators || allEvaluators.length === 0) return [];

  const evaluatorMap = new Map();

  allEvaluators.forEach((evaluator) => {
    // FIXED SLOT STRUCTURE: Filter assignments where evaluator exists in JEVA_FIRST or JEVA_SECOND
    const evaluatorAssignments = assignments.filter((a) => {
      // Check fixed slot structure
      if (a.evaluators) {
        const jevaFirst = a.evaluators.JEVA_FIRST;
        const jevaSecond = a.evaluators.JEVA_SECOND;
        return (
          (jevaFirst && jevaFirst.evaluatorId === evaluator.id) ||
          (jevaSecond && jevaSecond.evaluatorId === evaluator.id)
        );
      }
      // Legacy structure
      return a.evaluator1Id === evaluator.id || a.evaluator2Id === evaluator.id;
    });

    const totalRestaurants = evaluatorAssignments.length;
    const completedRestaurants = evaluatorAssignments.filter((a) => {
      // Check fixed slot structure
      if (a.evaluators) {
        const jevaFirst = a.evaluators.JEVA_FIRST;
        const jevaSecond = a.evaluators.JEVA_SECOND;

        if (jevaFirst && jevaFirst.evaluatorId === evaluator.id) {
          return (
            jevaFirst.status === "completed" ||
            jevaFirst.evaluatorStatus === "completed"
          );
        }
        if (jevaSecond && jevaSecond.evaluatorId === evaluator.id) {
          return (
            jevaSecond.status === "completed" ||
            jevaSecond.evaluatorStatus === "completed"
          );
        }
        return false;
      }
      // Legacy structure
      if (a.evaluator1Id === evaluator.id) {
        return a.evaluator1Status === "completed";
      }
      if (a.evaluator2Id === evaluator.id) {
        return a.evaluator2Status === "completed";
      }
      return false;
    }).length;

    // Determine NDA status from nested object or flat property
    let ndaStatus = "Not Sent";

    if (evaluator.nda && evaluator.nda.status) {
      const status = evaluator.nda.status.toLowerCase();
      if (status === "signed" || status === "completed") {
        ndaStatus = "Signed";
      } else if (["sent", "delivered", "pending"].includes(status)) {
        ndaStatus = "Pending";
      }
    } else if (evaluator.ndaStatus) {
      // Fallback for flat property (dummy data)
      ndaStatus = evaluator.ndaStatus;
    }

    // Handle specialties - could be array, string, or object
    let specialtyDisplay = "";
    if (Array.isArray(evaluator.specialties)) {
      specialtyDisplay = evaluator.specialties.join(", ");
    } else if (typeof evaluator.specialties === "string") {
      specialtyDisplay = evaluator.specialties;
    } else if (
      typeof evaluator.specialties === "object" &&
      evaluator.specialties !== null
    ) {
      // If it's an object (Firebase structure), try to get values
      const specialtyValues = Object.values(evaluator.specialties);
      specialtyDisplay =
        specialtyValues.length > 0 ? specialtyValues.join(", ") : "";
    } else {
      specialtyDisplay = evaluator.specialties || "";
    }

    // Helper function to safely convert values to strings
    const safeStringValue = (value: any, fallback: string = "") => {
      if (value === null || value === undefined) return fallback;
      if (typeof value === "object") return fallback;
      return String(value);
    };

    evaluatorMap.set(evaluator.id, {
      id: evaluator.id, // Required by Table component
      key: evaluator.id, // Add key for table
      eva_id: evaluator.id,
      evaluator_name: safeStringValue(evaluator.name, "Unknown"),
      name: safeStringValue(evaluator.name, "Unknown"),
      email: safeStringValue(evaluator.email, ""),
      phone: safeStringValue(evaluator.phone, ""),
      specialty: specialtyDisplay,
      specialties: Array.isArray(evaluator.specialties)
        ? evaluator.specialties
        : typeof evaluator.specialties === "object" &&
            evaluator.specialties !== null
          ? Object.values(evaluator.specialties)
          : typeof evaluator.specialties === "string"
            ? [evaluator.specialties]
            : [],
      nda_status: ndaStatus,
      total_restaurant: totalRestaurants,
      restaurant_completed: completedRestaurants,
      total_reminder_sent: evaluator.totalReminderSent || 0,
      fcmTokens: evaluator.fcmTokens,
    });
  });

  return Array.from(evaluatorMap.values());
};
export const getRestaurantViewData = (
  establishments: any[],
  assignments: any[],
  evaluators: any[],
) => {
  if (!establishments || establishments.length === 0) return [];

  return establishments.map((establishment) => {
    // FIXED SLOT STRUCTURE: Find assignment where JEVA_FIRST or JEVA_SECOND has this establishmentId
    const assignment = assignments.find((a) => {
      // Check fixed slot structure
      if (a.evaluators) {
        const jevaFirst = a.evaluators.JEVA_FIRST;
        const jevaSecond = a.evaluators.JEVA_SECOND;
        return (
          (jevaFirst && jevaFirst.establishmentId === establishment.id) ||
          (jevaSecond && jevaSecond.establishmentId === establishment.id)
        );
      }
      // Legacy structure
      return a.establishmentId === establishment.id;
    });

    if (!assignment) {
      // Helper function to safely convert values to strings
      const safeStringValue = (value: any, fallback: string = "-") => {
        if (value === null || value === undefined) return fallback;
        if (typeof value === "object") return fallback;
        return String(value);
      };

      return {
        id: establishment.id, // Required by Table component
        key: establishment.id, // Add key for table
        res_id: establishment.id,
        name: safeStringValue(establishment.name, "Unknown"),
        category: safeStringValue(establishment.category, "Unknown"),
        rating: safeStringValue(establishment.rating, "-"),
        budget: safeStringValue(establishment.budget, "-"),
        currency: safeStringValue(establishment.currency, ""),
        halal_status: safeStringValue(establishment.halalStatus, "-"),
        remark: safeStringValue(establishment.remarks, "-"),
        contact: safeStringValue(establishment.contactInfo, "-"),
        matched: "No",
        date_assigned: "-",
        evaluator_1: "-",
        evaluator1_assigned_date: "-",
        evaluator_2: "-",
        evaluator2_assigned_date: "-",
        completed_eva_1: "-",
        completed_eva_2: "-",
        evaluator1_progress: "Not Started",
        evaluator2_progress: "Not Started",
        evaluator1_receipt: null,
        evaluator1_amount_spent: null,
        evaluator2_receipt: null,
        evaluator2_amount_spent: null,
      };
    }

    // FIXED SLOT STRUCTURE: Extract evaluators from JEVA_FIRST and JEVA_SECOND
    let evaluator1Data: any = null;
    let evaluator2Data: any = null;
    let evaluator1: any = null;
    let evaluator2: any = null;
    let dateAssigned = "-";
    let evaluator1AssignedDate = "-";
    let evaluator2AssignedDate = "-";

    if (assignment.evaluators) {
      // Use fixed slot keys
      const jevaFirst = assignment.evaluators.JEVA_FIRST;
      const jevaSecond = assignment.evaluators.JEVA_SECOND;

      if (jevaFirst) {
        evaluator1Data = jevaFirst;
        evaluator1 = evaluators.find((e) => e.id === jevaFirst.evaluatorId);
        dateAssigned = jevaFirst.assignedAt
          ? new Date(jevaFirst.assignedAt).toLocaleDateString()
          : "-";
        evaluator1AssignedDate = jevaFirst.assignedAt
          ? new Date(jevaFirst.assignedAt).toLocaleDateString()
          : "-";
      }
      if (jevaSecond) {
        evaluator2Data = jevaSecond;
        evaluator2 = evaluators.find((e) => e.id === jevaSecond.evaluatorId);
        evaluator2AssignedDate = jevaSecond.assignedAt
          ? new Date(jevaSecond.assignedAt).toLocaleDateString()
          : "-";
      }
    } else {
      // Legacy structure fallback
      evaluator1 = evaluators.find((e) => e.id === assignment.evaluator1Id);
      evaluator2 = evaluators.find((e) => e.id === assignment.evaluator2Id);
      dateAssigned = assignment.assignedAt
        ? new Date(assignment.assignedAt).toLocaleDateString()
        : "-";
      // For legacy structure, check individual assignment dates
      evaluator1AssignedDate = assignment.evaluator1AssignedAt
        ? new Date(assignment.evaluator1AssignedAt).toLocaleDateString()
        : "-";
      evaluator2AssignedDate = assignment.evaluator2AssignedAt
        ? new Date(assignment.evaluator2AssignedAt).toLocaleDateString()
        : "-";
    }

    // Determine progress status based on assignment status
    const getProgressStatus = (status: string | undefined) => {
      if (!status) return "Not Started";
      if (status === "in-progress" || status === "pending")
        return "In Progress";
      if (status === "completed") return "Completed";
      return "Not Started";
    };

    // Get status from new structure or legacy
    const eval1Status =
      evaluator1Data?.status ||
      evaluator1Data?.evaluatorStatus ||
      assignment.evaluator1Status;
    const eval2Status =
      evaluator2Data?.status ||
      evaluator2Data?.evaluatorStatus ||
      assignment.evaluator2Status;

    // Get receipt and amount spent for each evaluator
    // Check JEVA structure first, then legacy structure
    const evaluator1Receipt =
      evaluator1Data?.receiptUrl ||
      evaluator1Data?.receipt ||
      assignment.evaluator1Receipt ||
      null;
    const evaluator1AmountSpent =
      evaluator1Data?.amountSpent !== undefined
        ? evaluator1Data.amountSpent
        : assignment.evaluator1AmountSpent !== undefined
          ? assignment.evaluator1AmountSpent
          : null;

    const evaluator2Receipt =
      evaluator2Data?.receiptUrl ||
      evaluator2Data?.receipt ||
      assignment.evaluator2Receipt ||
      null;
    const evaluator2AmountSpent =
      evaluator2Data?.amountSpent !== undefined
        ? evaluator2Data.amountSpent
        : assignment.evaluator2AmountSpent !== undefined
          ? assignment.evaluator2AmountSpent
          : null;

    // Helper function to safely convert values to strings
    const safeStringValue = (value: any, fallback: string = "-") => {
      if (value === null || value === undefined) return fallback;
      if (typeof value === "object") return fallback;
      return String(value);
    };

    return {
      id: establishment.id, // Required by Table component
      key: establishment.id, // Add key for table
      res_id: establishment.id,
      name: safeStringValue(establishment.name, "Unknown"),
      category: safeStringValue(establishment.category, "Unknown"),
      rating: safeStringValue(establishment.rating, "-"),
      budget: safeStringValue(establishment.budget, "-"),
      currency: safeStringValue(establishment.currency, ""),
      halal_status: safeStringValue(establishment.halalStatus, "-"),
      remark: safeStringValue(establishment.remarks, "-"),
      contact: safeStringValue(establishment.contactInfo, "-"),
      matched: "Yes",
      date_assigned: dateAssigned,
      evaluator_1: safeStringValue(evaluator1?.name, "-"),
      evaluator1_assigned_date: evaluator1AssignedDate,
      evaluator_2: safeStringValue(evaluator2?.name, "-"),
      evaluator2_assigned_date: evaluator2AssignedDate,
      completed_eva_1: eval1Status === "completed" ? "Yes" : "No",
      completed_eva_2: eval2Status === "completed" ? "Yes" : "No",
      evaluator1_progress: getProgressStatus(eval1Status),
      evaluator2_progress: getProgressStatus(eval2Status),
      evaluator1_receipt: evaluator1Receipt,
      evaluator1_amount_spent: evaluator1AmountSpent,
      evaluator2_receipt: evaluator2Receipt,
      evaluator2_amount_spent: evaluator2AmountSpent,
    };
  });
};

// Handler functions
export const handleMatchEvaluator = async (
  setIsLoading: (loading: boolean) => void,
  assignments: any[],
  establishments: any[],
  fetchData: () => Promise<void>,
) => {
  try {
    setIsLoading(true);

    // Find unassigned restaurants
    const assignedEstablishmentIds = assignments.map((a) => a.establishmentId);
    const unassignedEstablishments = establishments.filter(
      (est) => !assignedEstablishmentIds.includes(est.id),
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
        fetch("/api/admin/assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ establishmentId: establishment.id }),
        }).then((res) => res.json()),
      ),
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

export const handleManualMatch = (
  setIsManualMatchOpen: (open: boolean) => void,
) => {
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
  setSelectedRestaurant: (id: string) => void,
) => {
  if (!selectedEvaluator || !selectedRestaurant) return;

  try {
    setIsLoading(true);

    // Get the restaurant details
    const restaurant = establishments.find((e) => e.id === selectedRestaurant);
    const evaluator = evaluators.find((e) => e.id === selectedEvaluator);

    if (!restaurant || !evaluator) {
      throw new Error("Restaurant or evaluator not found");
    }

    // Check if evaluator specialty matches restaurant category
    if (
      !Array.isArray(evaluator.specialties) ||
      !evaluator.specialties.includes(restaurant.category)
    ) {
      setIsLoading(false);
      await Swal.fire({
        icon: "error",
        title: "Specialty Mismatch",
        text: `Evaluator ${evaluator.name} does not have specialty "${restaurant.category}" required for ${restaurant.name}.`,
      });
      return;
    }

    // Check if restaurant already has assignments
    const existingAssignments = assignments.filter(
      (a) => a.establishmentId === selectedRestaurant,
    );

    if (existingAssignments.length > 0) {
      const assignment = existingAssignments[0];

      // Check if this evaluator is already assigned
      if (
        assignment.evaluator1Id === selectedEvaluator ||
        assignment.evaluator2Id === selectedEvaluator
      ) {
        setIsLoading(false);
        await Swal.fire({
          icon: "warning",
          title: "Already Assigned",
          text: `${evaluator.name} is already assigned to ${restaurant.name}.`,
        });
        return;
      }

      // If restaurant has 2 evaluators, show error
      if (assignment.evaluator1Id && assignment.evaluator2Id) {
        setIsLoading(false);
        await Swal.fire({
          icon: "warning",
          title: "Maximum Evaluators Reached",
          text: `${restaurant.name} already has 2 evaluators assigned.`,
        });
        return;
      }
    }

    // Create new assignment (API will auto-select second evaluator if available)
    const response = await fetch("/api/admin/assignments", {
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

export const handleSendNDAReminder = async (evaluator: any) => {
  if (!evaluator.fcmTokens) {
    await Swal.fire({
      icon: "warning",
      title: "No Token Found",
      text: "This evaluator does not have a registered device for notifications.",
      confirmButtonColor: "#A67C37",
    });
    return;
  }

  const result = await Swal.fire({
    title: "Send NDA Reminder?",
    text: `Send notification to ${evaluator.name}?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#A67C37",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, send it!",
  });

  if (result.isConfirmed) {
    try {
      const response = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: evaluator.fcmTokens,
          userId: evaluator.id,
          title: "NDA Reminder",
          message: "Please sign your NDA. Check your email for the document.",
          url: "/user/dashboard",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send notification");
      }

      await Swal.fire({
        icon: "success",
        title: "Sent!",
        text: "NDA reminder has been sent.",
        confirmButtonColor: "#A67C37",
      });
    } catch (error) {
      console.error("Error sending reminder:", error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to send reminder.",
        confirmButtonColor: "#A67C37",
      });
    }
  }
};

export const handleSendCompletionReminder = async (evaluator: any) => {
  if (!evaluator.fcmTokens) {
    await Swal.fire({
      icon: "warning",
      title: "No Token Found",
      text: "This evaluator does not have a registered device for notifications.",
      confirmButtonColor: "#A67C37",
    });
    return;
  }

  const result = await Swal.fire({
    title: "Send Completion Reminder?",
    text: `Send notification to ${evaluator.name}?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#A67C37",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, send it!",
  });

  if (result.isConfirmed) {
    try {
      const response = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: evaluator.fcmTokens,
          userId: evaluator.id,
          title: "Complete your Evaluation!",
          message: `You have completed ${evaluator.restaurant_completed}/${evaluator.total_restaurant} assignments. Please complete the remaining evaluations.`,
          url: "/user/dashboard",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send notification");
      }

      await Swal.fire({
        icon: "success",
        title: "Sent!",
        text: "Completion reminder has been sent.",
        confirmButtonColor: "#A67C37",
      });
    } catch (error) {
      console.error("Error sending reminder:", error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to send reminder.",
        confirmButtonColor: "#A67C37",
      });
    }
  }
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
  setIsEditModalOpen: (open: boolean) => void,
) => {
  if (selectedView === "restaurant") {
    // FIXED SLOT STRUCTURE: Find the assignment for this restaurant
    const assignment = assignments.find((a) => {
      if (a.evaluators) {
        const jevaFirst = a.evaluators.JEVA_FIRST;
        const jevaSecond = a.evaluators.JEVA_SECOND;
        return (
          (jevaFirst && jevaFirst.establishmentId === item.res_id) ||
          (jevaSecond && jevaSecond.establishmentId === item.res_id)
        );
      }
      // Legacy structure
      return a.establishmentId === item.res_id;
    });

    setEditingRestaurant(item);

    // FIXED SLOT STRUCTURE: Extract evaluator IDs from JEVA_FIRST and JEVA_SECOND
    if (assignment?.evaluators) {
      const jevaFirst = assignment.evaluators.JEVA_FIRST;
      const jevaSecond = assignment.evaluators.JEVA_SECOND;
      setEditEvaluator1(jevaFirst?.evaluatorId || "");
      setEditEvaluator2(jevaSecond?.evaluatorId || "");
    } else {
      // Legacy structure fallback
      setEditEvaluator1(assignment?.evaluator1Id || "");
      setEditEvaluator2(assignment?.evaluator2Id || "");
    }

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
  setEditEvaluator2: (id: string) => void,
): Promise<boolean> => {
  if (!editingRestaurant) return false;

  try {
    setIsLoading(true);

    // FIXED SLOT STRUCTURE: Find assignment where JEVA_FIRST or JEVA_SECOND has this establishmentId
    const assignment = assignments.find((a) => {
      if (a.evaluators) {
        const jevaFirst = a.evaluators.JEVA_FIRST;
        const jevaSecond = a.evaluators.JEVA_SECOND;
        return (
          (jevaFirst &&
            jevaFirst.establishmentId === editingRestaurant.res_id) ||
          (jevaSecond &&
            jevaSecond.establishmentId === editingRestaurant.res_id)
        );
      }
      // Fallback for legacy structure
      return a.establishmentId === editingRestaurant.res_id;
    });

    // If no assignment, we will create one. No need to return error.
    // if (!assignment) { ... }

    // Validate specialty matches
    const restaurant = establishments.find(
      (e) => e.id === editingRestaurant.res_id,
    );

    if (editEvaluator1) {
      const evaluator1 = evaluators.find((e) => e.id === editEvaluator1);
      if (
        evaluator1 &&
        (!Array.isArray(evaluator1.specialties) ||
          !evaluator1.specialties.includes(restaurant?.category))
      ) {
        setIsLoading(false);
        await Swal.fire({
          icon: "error",
          title: "Specialty Mismatch",
          text: `Evaluator 1 (${evaluator1.name}) does not have specialty "${restaurant?.category}".`,
        });
        return false;
      }
    }

    if (editEvaluator2) {
      const evaluator2 = evaluators.find((e) => e.id === editEvaluator2);
      if (
        evaluator2 &&
        (!Array.isArray(evaluator2.specialties) ||
          !evaluator2.specialties.includes(restaurant?.category))
      ) {
        setIsLoading(false);
        await Swal.fire({
          icon: "error",
          title: "Specialty Mismatch",
          text: `Evaluator 2 (${evaluator2.name}) does not have specialty "${restaurant?.category}".`,
        });
        return false;
      }
    }

    // If both evaluators are removed, delete the assignment (only if assignment exists)
    if (!editEvaluator1 && !editEvaluator2) {
      if (assignment) {
        const response = await fetch(
          `/api/admin/assignments?id=${assignment.id}`,
          {
            method: "DELETE",
          },
        );

        if (!response.ok) {
          throw new Error("Failed to delete assignment");
        }

        await Swal.fire({
          icon: "success",
          title: "Assignment Removed",
          text: `Successfully removed all evaluators from ${editingRestaurant.name}.`,
        });
      } else {
        // Nothing to delete
        await Swal.fire({
          icon: "info",
          title: "No Changes",
          text: "No assignment existed to remove.",
        });
      }
    } else {
      // Update or Create the assignment
      const payload: any = {
        evaluator1Id: editEvaluator1 || null,
        evaluator2Id: editEvaluator2 || null,
        // ALWAYS include establishmentId - needed for both create and update
        establishmentId: editingRestaurant.res_id,
      };

      if (assignment) {
        payload.id = assignment.id;
      }

      const response = await fetch(`/api/admin/assignments`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update assignment");
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
    return true;
  } catch (error: any) {
    console.error("Error updating assignment:", error);
    await Swal.fire({
      icon: "error",
      title: "Update Failed",
      text: error.message || "An error occurred while updating the assignment.",
    });
    return false;
  } finally {
    setIsLoading(false);
  }
};
