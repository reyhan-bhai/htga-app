import { db } from "@/lib/firebase-admin";
import {
  Assignment,
  AssignmentEvaluatorData,
  AssignmentWithDetails,
  Establishment,
  Evaluator,
} from "@/types/restaurant";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

// Helper function to get assignment with details (FIXED SLOT STRUCTURE)
async function getAssignmentWithDetails(
  assignmentId: string,
  assignment: Assignment
): Promise<AssignmentWithDetails> {
  const evaluatorsDetails: (Evaluator &
    AssignmentEvaluatorData & { slot: string })[] = [];
  let establishment: Establishment | undefined;

  // Handle fixed slot structure: JEVA_FIRST and JEVA_SECOND
  if (assignment.evaluators) {
    const slots = ["JEVA_FIRST", "JEVA_SECOND"] as const;

    for (const slot of slots) {
      const evalData = assignment.evaluators[slot];
      if (!evalData) continue;

      // Fetch evaluator info using evaluatorId from the slot data
      const evaluatorSnap = await db
        .ref(`evaluators/${evalData.evaluatorId}`)
        .once("value");

      // Fetch establishment info (use establishmentId from within evaluator data)
      if (!establishment && evalData.establishmentId) {
        const estSnap = await db
          .ref(`establishments/${evalData.establishmentId}`)
          .once("value");
        if (estSnap.exists()) {
          establishment = { id: evalData.establishmentId, ...estSnap.val() };
        }
      }

      if (evaluatorSnap.exists()) {
        evaluatorsDetails.push({
          id: evalData.evaluatorId,
          slot, // Include slot info for ordering
          ...evaluatorSnap.val(),
          ...evalData,
        });
      }
    }
  }

  return {
    ...assignment,
    establishment,
    evaluatorsDetails,
  } as AssignmentWithDetails;
}

// GET - Get all assignments or specific assignment by ID
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const establishmentId = searchParams.get("establishmentId");
    const evaluatorId = searchParams.get("evaluatorId");
    const includeDetails = searchParams.get("includeDetails") === "true";

    if (id) {
      // Get specific assignment
      const snapshot = await db.ref(`assignments/${id}`).once("value");
      const assignment = snapshot.val();

      if (!assignment) {
        return NextResponse.json(
          { error: "Assignment not found" },
          { status: 404 }
        );
      }

      const assignmentData = { id, ...assignment };

      if (includeDetails) {
        const detailedAssignment = await getAssignmentWithDetails(
          id,
          assignmentData
        );
        return NextResponse.json({ assignment: detailedAssignment });
      }

      return NextResponse.json({ assignment: assignmentData });
    }

    // Get all assignments with optional filters
    const snapshot = await db.ref("assignments").once("value");
    const assignmentsData = snapshot.val();

    let assignments: Assignment[] = assignmentsData
      ? Object.entries(assignmentsData).map(([id, data]: [string, any]) => ({
          id,
          ...data,
        }))
      : [];

    // Apply filters - FIXED SLOT STRUCTURE: establishmentId is inside JEVA_FIRST/JEVA_SECOND
    if (establishmentId) {
      assignments = assignments.filter((a) => {
        // Fixed slot structure: check JEVA_FIRST and JEVA_SECOND
        if (a.evaluators) {
          const jevaFirst = a.evaluators.JEVA_FIRST;
          const jevaSecond = a.evaluators.JEVA_SECOND;
          return (
            (jevaFirst && jevaFirst.establishmentId === establishmentId) ||
            (jevaSecond && jevaSecond.establishmentId === establishmentId)
          );
        }
        // Legacy structure
        return a.establishmentId === establishmentId;
      });
    }

    if (evaluatorId) {
      assignments = assignments.filter((a) => {
        // Check fixed slot structure
        if (a.evaluators) {
          const jevaFirst = a.evaluators.JEVA_FIRST;
          const jevaSecond = a.evaluators.JEVA_SECOND;
          return (
            (jevaFirst && jevaFirst.evaluatorId === evaluatorId) ||
            (jevaSecond && jevaSecond.evaluatorId === evaluatorId)
          );
        }
        // Check legacy structure
        return a.evaluator1Id === evaluatorId || a.evaluator2Id === evaluatorId;
      });
    }

    // Include details if requested
    if (includeDetails && assignments.length > 0) {
      const detailedAssignments = await Promise.all(
        assignments.map((assignment) =>
          getAssignmentWithDetails(assignment.id, assignment)
        )
      );

      return NextResponse.json({
        assignments: detailedAssignments,
        count: detailedAssignments.length,
      });
    }

    return NextResponse.json({
      assignments,
      count: assignments.length,
    });
  } catch (error: any) {
    console.error("Error getting assignments:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new assignment (with auto-matching logic)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { establishmentId, evaluator1Id, evaluator2Id, forceReassign } = body;

    // Validation
    if (!establishmentId) {
      return NextResponse.json(
        { error: "Establishment ID is required" },
        { status: 400 }
      );
    }

    // Check if establishment exists
    const establishmentSnap = await db
      .ref(`establishments/${establishmentId}`)
      .once("value");
    if (!establishmentSnap.exists()) {
      return NextResponse.json(
        { error: "Establishment not found" },
        { status: 404 }
      );
    }

    const establishment: Establishment = {
      id: establishmentId,
      ...establishmentSnap.val(),
    };

    // Check if already assigned
    const existingAssignmentSnap = await db
      .ref("assignments")
      .orderByChild("establishmentId")
      .equalTo(establishmentId)
      .once("value");

    if (existingAssignmentSnap.exists() && !forceReassign) {
      return NextResponse.json(
        {
          error:
            "Establishment already has an assignment. Use forceReassign=true to override.",
        },
        { status: 400 }
      );
    }

    let selectedEvaluator1Id = evaluator1Id;
    let selectedEvaluator2Id = evaluator2Id;

    // Get all evaluators with matching specialty
    const evaluatorsSnap = await db.ref("evaluators").once("value");
    const evaluatorsData = evaluatorsSnap.val();

    if (!evaluatorsData) {
      return NextResponse.json(
        { error: "No evaluators available" },
        { status: 400 }
      );
    }

    const allEvaluators: Evaluator[] = Object.entries(evaluatorsData).map(
      ([id, data]: [string, any]) => ({ id, ...data })
    );

    // Filter evaluators by specialty match
    const matchingEvaluators = allEvaluators.filter((evaluator) =>
      evaluator.specialties.includes(establishment.category)
    );

    if (matchingEvaluators.length < 1) {
      return NextResponse.json(
        {
          error: `Not enough evaluators with specialty "${establishment.category}". Need at least 1, found ${matchingEvaluators.length}.`,
        },
        { status: 400 }
      );
    }

    // Get current assignments count for each evaluator
    const assignmentsSnap = await db.ref("assignments").once("value");
    const assignmentsData = assignmentsSnap.val();

    const evaluatorAssignmentCounts = new Map<string, number>();
    if (assignmentsData) {
      Object.values(assignmentsData).forEach((assignment: any) => {
        // Count from fixed slot structure
        if (assignment.evaluators) {
          const jevaFirst = assignment.evaluators.JEVA_FIRST;
          const jevaSecond = assignment.evaluators.JEVA_SECOND;

          if (jevaFirst && jevaFirst.evaluatorId) {
            evaluatorAssignmentCounts.set(
              jevaFirst.evaluatorId,
              (evaluatorAssignmentCounts.get(jevaFirst.evaluatorId) || 0) + 1
            );
          }
          if (jevaSecond && jevaSecond.evaluatorId) {
            evaluatorAssignmentCounts.set(
              jevaSecond.evaluatorId,
              (evaluatorAssignmentCounts.get(jevaSecond.evaluatorId) || 0) + 1
            );
          }
        }
        // Count from legacy structure
        else {
          if (assignment.evaluator1Id) {
            evaluatorAssignmentCounts.set(
              assignment.evaluator1Id,
              (evaluatorAssignmentCounts.get(assignment.evaluator1Id) || 0) + 1
            );
          }
          if (assignment.evaluator2Id) {
            evaluatorAssignmentCounts.set(
              assignment.evaluator2Id,
              (evaluatorAssignmentCounts.get(assignment.evaluator2Id) || 0) + 1
            );
          }
        }
      });
    }

    // Sort by least assignments first
    const sortedEvaluators = matchingEvaluators.sort((a, b) => {
      const aCount = evaluatorAssignmentCounts.get(a.id) || 0;
      const bCount = evaluatorAssignmentCounts.get(b.id) || 0;
      return aCount - bCount;
    });

    // If evaluators not provided, auto-assign both
    if (!evaluator1Id && !evaluator2Id) {
      selectedEvaluator1Id = sortedEvaluators[0].id;
      selectedEvaluator2Id =
        sortedEvaluators.length > 1 ? sortedEvaluators[1].id : "";

      console.log("Auto-assigned evaluators:", {
        evaluator1: sortedEvaluators[0].name,
        evaluator2:
          sortedEvaluators.length > 1
            ? sortedEvaluators[1].name
            : "Not assigned",
        establishment: establishment.name,
        note:
          sortedEvaluators.length === 1
            ? "Only 1 evaluator available - assigned to evaluator1 only"
            : "2 evaluators assigned",
      });
    }
    // If only evaluator1 provided, auto-assign evaluator2
    else if (evaluator1Id && !evaluator2Id) {
      // Validate evaluator1 has matching specialty
      const evaluator1 = matchingEvaluators.find((e) => e.id === evaluator1Id);
      if (!evaluator1) {
        return NextResponse.json(
          {
            error: `Evaluator does not have specialty "${establishment.category}"`,
          },
          { status: 400 }
        );
      }

      // Find best match for evaluator2 (excluding evaluator1)
      const availableEvaluators = sortedEvaluators.filter(
        (e) => e.id !== evaluator1Id
      );

      if (availableEvaluators.length === 0) {
        // If no other evaluator available, leave evaluator2 empty
        selectedEvaluator2Id = "";
      } else {
        selectedEvaluator2Id = availableEvaluators[0].id;
      }

      console.log("Auto-assigned evaluator2:", {
        evaluator1: evaluator1.name,
        evaluator2: availableEvaluators[0].name,
        establishment: establishment.name,
      });
    }
    // If both evaluators provided, validate them
    else {
      // Check if evaluators exist and have matching specialty
      const [eval1Snap, eval2Snap] = await Promise.all([
        db.ref(`evaluators/${selectedEvaluator1Id}`).once("value"),
        db.ref(`evaluators/${selectedEvaluator2Id}`).once("value"),
      ]);

      if (!eval1Snap.exists() || !eval2Snap.exists()) {
        return NextResponse.json(
          { error: "One or both evaluators not found" },
          { status: 404 }
        );
      }

      const evaluator1: Evaluator = {
        id: selectedEvaluator1Id,
        ...eval1Snap.val(),
      };
      const evaluator2: Evaluator = {
        id: selectedEvaluator2Id,
        ...eval2Snap.val(),
      };

      // Check specialty match
      if (
        !evaluator1.specialties.includes(establishment.category) ||
        !evaluator2.specialties.includes(establishment.category)
      ) {
        return NextResponse.json(
          {
            error: `Both evaluators must have specialty "${establishment.category}"`,
          },
          { status: 400 }
        );
      }
    }

    // Delete existing assignment if forceReassign
    if (existingAssignmentSnap.exists() && forceReassign) {
      const existingAssignments = existingAssignmentSnap.val();
      await Promise.all(
        Object.keys(existingAssignments).map((key) =>
          db.ref(`assignments/${key}`).remove()
        )
      );
    }

    // Create new assignment
    // Generate sequential ID using transaction to handle concurrent requests
    const counterRef = db.ref("assignments/counters");
    const transactionResult = await counterRef.transaction((currentValue) => {
      return (currentValue || 0) + 1;
    });

    if (!transactionResult.committed) {
      throw new Error("Failed to generate assignment ID");
    }

    const count = transactionResult.snapshot.val();
    const assignmentId = `ASSIGN${String(count).padStart(2, "0")}`;

    const assignmentRef = db.ref(`assignments/${assignmentId}`);

    const assignedAt = new Date().toISOString();

    // FIXED SLOT STRUCTURE: Use JEVA_FIRST and JEVA_SECOND as fixed keys
    const newAssignment: any = {
      evaluators: {},
    };

    if (selectedEvaluator1Id) {
      newAssignment.evaluators.JEVA_FIRST = {
        uniqueId: randomUUID(),
        establishmentId,
        assignedAt,
        evaluatorId: selectedEvaluator1Id,
        evaluatorStatus: "pending",
        status: "pending",
      };
    }

    // Only add evaluator2 if assigned
    if (selectedEvaluator2Id) {
      newAssignment.evaluators.JEVA_SECOND = {
        uniqueId: randomUUID(),
        establishmentId,
        assignedAt,
        evaluatorId: selectedEvaluator2Id,
        evaluatorStatus: "pending",
        status: "pending",
      };
    }

    await assignmentRef.set(newAssignment);

    const detailedAssignment = await getAssignmentWithDetails(assignmentId, {
      id: assignmentId,
      ...newAssignment,
    });

    return NextResponse.json(
      {
        message: "Assignment created successfully",
        assignment: detailedAssignment,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating assignment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update assignment status and evaluators, or create if not exists
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      establishmentId, // Add establishmentId to body for creation
      evaluator1Status,
      evaluator2Status,
      notes,
      evaluator1Id,
      evaluator2Id,
    } = body;

    // If id is provided, try to update existing assignment
    if (id) {
      // Check if assignment exists
      const snapshot = await db.ref(`assignments/${id}`).once("value");

      if (snapshot.exists()) {
        const currentAssignment = snapshot.val();
        const updates: any = {};

        // Validate evaluators if provided and not empty
        if (evaluator1Id) {
          const evaluator1Snap = await db
            .ref(`evaluators/${evaluator1Id}`)
            .once("value");
          if (!evaluator1Snap.exists()) {
            return NextResponse.json(
              { error: "Evaluator 1 not found" },
              { status: 404 }
            );
          }
        }

        if (evaluator2Id) {
          const evaluator2Snap = await db
            .ref(`evaluators/${evaluator2Id}`)
            .once("value");
          if (!evaluator2Snap.exists()) {
            return NextResponse.json(
              { error: "Evaluator 2 not found" },
              { status: 404 }
            );
          }
        }

        // FIXED SLOT STRUCTURE: Update status inside JEVA_FIRST/JEVA_SECOND
        if (evaluator1Status) {
          updates[`evaluators/JEVA_FIRST/status`] = evaluator1Status;
          updates[`evaluators/JEVA_FIRST/evaluatorStatus`] = evaluator1Status;
          if (evaluator1Status === "completed") {
            updates[`evaluators/JEVA_FIRST/completedAt`] =
              new Date().toISOString();
          }
        }

        if (evaluator2Status) {
          updates[`evaluators/JEVA_SECOND/status`] = evaluator2Status;
          updates[`evaluators/JEVA_SECOND/evaluatorStatus`] = evaluator2Status;
          if (evaluator2Status === "completed") {
            updates[`evaluators/JEVA_SECOND/completedAt`] =
              new Date().toISOString();
          }
        }

        if (notes !== undefined) {
          updates.notes = notes;
        }

        // FIXED SLOT STRUCTURE: Handle evaluator changes using JEVA_FIRST/JEVA_SECOND
        const hasEvaluatorChanges =
          evaluator1Id !== undefined || evaluator2Id !== undefined;

        if (hasEvaluatorChanges && establishmentId) {
          const assignedAt = new Date().toISOString();
          const currentEvaluators = currentAssignment.evaluators || {};

          // Handle Evaluator 1 (JEVA_FIRST slot)
          if (evaluator1Id !== undefined) {
            if (evaluator1Id === null || evaluator1Id === "") {
              // Remove evaluator 1
              updates[`evaluators/JEVA_FIRST`] = null;
            } else {
              // Check if same evaluator - preserve data
              const currentEval1 = currentEvaluators.JEVA_FIRST;
              if (currentEval1 && currentEval1.evaluatorId === evaluator1Id) {
                // Same evaluator, preserve existing data (no update needed for this slot)
              } else {
                // New evaluator for slot 1
                updates[`evaluators/JEVA_FIRST`] = {
                  uniqueId: randomUUID(),
                  establishmentId,
                  assignedAt,
                  evaluatorId: evaluator1Id,
                  evaluatorStatus: evaluator1Status || "pending",
                  status: evaluator1Status || "pending",
                };
              }
            }
          }

          // Handle Evaluator 2 (JEVA_SECOND slot)
          if (evaluator2Id !== undefined) {
            if (evaluator2Id === null || evaluator2Id === "") {
              // Remove evaluator 2
              updates[`evaluators/JEVA_SECOND`] = null;
            } else {
              // Check if same evaluator - preserve data
              const currentEval2 = currentEvaluators.JEVA_SECOND;
              if (currentEval2 && currentEval2.evaluatorId === evaluator2Id) {
                // Same evaluator, preserve existing data (no update needed for this slot)
              } else {
                // New evaluator for slot 2
                updates[`evaluators/JEVA_SECOND`] = {
                  uniqueId: randomUUID(),
                  establishmentId,
                  assignedAt,
                  evaluatorId: evaluator2Id,
                  evaluatorStatus: evaluator2Status || "pending",
                  status: evaluator2Status || "pending",
                };
              }
            }
          }
        }

        await db.ref(`assignments/${id}`).update(updates);

        const updatedSnapshot = await db.ref(`assignments/${id}`).once("value");
        const updatedAssignment = { id, ...updatedSnapshot.val() };

        const detailedAssignment = await getAssignmentWithDetails(
          id,
          updatedAssignment
        );

        return NextResponse.json({
          message: "Assignment updated successfully",
          assignment: detailedAssignment,
        });
      }
    }

    // If ID not provided or assignment not found, create new assignment
    // We need establishmentId for creation
    if (!establishmentId) {
      // If we have an ID but it wasn't found, and no establishmentId provided, we can't create
      if (id) {
        return NextResponse.json(
          {
            error:
              "Assignment not found and establishmentId not provided for creation",
          },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "Establishment ID is required for new assignment" },
        { status: 400 }
      );
    }

    // Check if establishment exists
    const establishmentSnap = await db
      .ref(`establishments/${establishmentId}`)
      .once("value");
    if (!establishmentSnap.exists()) {
      return NextResponse.json(
        { error: "Establishment not found" },
        { status: 404 }
      );
    }

    // Generate sequential ID using transaction to handle concurrent requests
    const counterRef = db.ref("assignments/counters");
    const transactionResult = await counterRef.transaction((currentValue) => {
      return (currentValue || 0) + 1;
    });

    if (!transactionResult.committed) {
      throw new Error("Failed to generate assignment ID");
    }

    const count = transactionResult.snapshot.val();
    const assignmentId = `ASSIGN${String(count).padStart(2, "0")}`;
    const assignmentRef = db.ref(`assignments/${assignmentId}`);

    const assignedAt = new Date().toISOString();

    // NEW STRUCTURE: Each evaluator has its own metadata
    const newAssignment: any = {
      evaluators: {},
    };

    if (evaluator1Id) {
      newAssignment.evaluators[evaluator1Id] = {
        uniqueId: randomUUID(),
        establishmentId,
        assignedAt,
        evaluatorId: evaluator1Id,
        evaluatorStatus: "pending",
        status: "pending",
      };
    }

    if (evaluator2Id) {
      newAssignment.evaluators[evaluator2Id] = {
        uniqueId: randomUUID(),
        establishmentId,
        assignedAt,
        evaluatorId: evaluator2Id,
        evaluatorStatus: "pending",
        status: "pending",
      };
    }

    if (notes) {
      newAssignment.notes = notes;
    }

    await assignmentRef.set(newAssignment);

    const detailedAssignment = await getAssignmentWithDetails(assignmentId, {
      id: assignmentId,
      ...newAssignment,
    });

    return NextResponse.json(
      {
        message: "Assignment created successfully",
        assignment: detailedAssignment,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error updating/creating assignment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete assignment
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Assignment ID is required" },
        { status: 400 }
      );
    }

    // Check if assignment exists
    const snapshot = await db.ref(`assignments/${id}`).once("value");
    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    await db.ref(`assignments/${id}`).remove();

    return NextResponse.json({
      message: "Assignment deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting assignment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
