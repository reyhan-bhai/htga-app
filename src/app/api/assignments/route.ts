import { db } from "@/lib/firebase-admin";
import {
  Assignment,
  AssignmentWithDetails,
  Establishment,
  Evaluator,
} from "@/types/restaurant";
import crypto from "crypto";
import { NextResponse } from "next/server";

// Helper function to get assignment with details
async function getAssignmentWithDetails(
  assignmentId: string,
  assignment: Assignment
): Promise<AssignmentWithDetails> {
  const [establishmentSnap, evaluator1Snap, evaluator2Snap] = await Promise.all(
    [
      db.ref(`establishments/${assignment.establishmentId}`).once("value"),
      db.ref(`evaluators/${assignment.evaluator1Id}`).once("value"),
      db.ref(`evaluators/${assignment.evaluator2Id}`).once("value"),
    ]
  );

  return {
    ...assignment,
    establishment: {
      id: assignment.establishmentId,
      ...establishmentSnap.val(),
    },
    evaluator1: { id: assignment.evaluator1Id, ...evaluator1Snap.val() },
    evaluator2: { id: assignment.evaluator2Id, ...evaluator2Snap.val() },
  };
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

    // Apply filters
    if (establishmentId) {
      assignments = assignments.filter(
        (a) => a.establishmentId === establishmentId
      );
    }

    if (evaluatorId) {
      assignments = assignments.filter(
        (a) => a.evaluator1Id === evaluatorId || a.evaluator2Id === evaluatorId
      );
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
        evaluatorAssignmentCounts.set(
          assignment.evaluator1Id,
          (evaluatorAssignmentCounts.get(assignment.evaluator1Id) || 0) + 1
        );
        evaluatorAssignmentCounts.set(
          assignment.evaluator2Id,
          (evaluatorAssignmentCounts.get(assignment.evaluator2Id) || 0) + 1
        );
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

    const newAssignment: any = {
      establishmentId,
      evaluator1Id: selectedEvaluator1Id,
      evaluator1Status: "pending",
      evaluator1UniqueID: crypto.randomUUID(),
      assignedAt: new Date().toISOString(),
    };

    // Only add evaluator2 fields if evaluator2 is assigned
    if (selectedEvaluator2Id) {
      newAssignment.evaluator2Id = selectedEvaluator2Id;
      newAssignment.evaluator2Status = "pending";
      newAssignment.evaluator2UniqueID = crypto.randomUUID();
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
        // ... existing update logic ...
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

        const updates: Partial<Assignment> = {};

        if (evaluator1Status) {
          updates.evaluator1Status = evaluator1Status;
        }

        if (evaluator2Status) {
          updates.evaluator2Status = evaluator2Status;
        }

        // Check if both completed to set completedAt
        const currentAssignment = snapshot.val();
        const newEval1Status =
          evaluator1Status || currentAssignment.evaluator1Status;
        const newEval2Status =
          evaluator2Status || currentAssignment.evaluator2Status;

        if (newEval1Status === "completed" && newEval2Status === "completed") {
          updates.completedAt = new Date().toISOString();
        }

        if (notes !== undefined) {
          updates.notes = notes;
        }

        if (evaluator1Id !== undefined) {
          updates.evaluator1Id = evaluator1Id;
        }

        if (evaluator2Id !== undefined) {
          updates.evaluator2Id = evaluator2Id;
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

    const newAssignment: any = {
      establishmentId,
      evaluator1Id: evaluator1Id || "",
      evaluator1Status: "pending",
      evaluator1UniqueID: crypto.randomUUID(),
      assignedAt: new Date().toISOString(),
    };

    if (evaluator2Id) {
      newAssignment.evaluator2Id = evaluator2Id;
      newAssignment.evaluator2Status = "pending";
      newAssignment.evaluator2UniqueID = crypto.randomUUID();
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
