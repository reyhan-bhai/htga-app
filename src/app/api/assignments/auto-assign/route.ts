import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import {
  Assignment,
  Evaluator,
  Establishment,
  AssignmentWithDetails,
} from "@/types/restaurant";

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

// POST - Auto assign all establishments to evaluators
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clearExisting = searchParams.get("clearExisting") === "true";

    console.log("🚀 Starting auto-assignment process...");

    // Get all evaluators and establishments
    const [evaluatorsSnap, establishmentsSnap] = await Promise.all([
      db.ref("evaluators").once("value"),
      db.ref("establishments").once("value"),
    ]);

    if (!evaluatorsSnap.exists() || !establishmentsSnap.exists()) {
      return NextResponse.json(
        {
          error:
            "No evaluators or establishments found. Please seed data first.",
        },
        { status: 400 }
      );
    }

    const evaluators: Evaluator[] = Object.entries(evaluatorsSnap.val()).map(
      ([id, data]: [string, any]) => ({ id, ...data })
    );

    const establishments: Establishment[] = Object.entries(
      establishmentsSnap.val()
    ).map(([id, data]: [string, any]) => ({ id, ...data }));

    console.log(
      `📊 Found ${evaluators.length} evaluators and ${establishments.length} establishments`
    );

    // Clear existing assignments if requested
    if (clearExisting) {
      await db.ref("assignments").remove();
      console.log("🗑️ Cleared existing assignments");
    }

    // Track evaluator assignment counts for load balancing
    const evaluatorAssignmentCounts = new Map<string, number>();
    evaluators.forEach((e) => evaluatorAssignmentCounts.set(e.id, 0));

    const successfulAssignments: AssignmentWithDetails[] = [];
    const failedAssignments: {
      establishment: Establishment;
      reason: string;
    }[] = [];

    // Process each establishment
    for (const establishment of establishments) {
      try {
        console.log(
          `\n🏢 Processing: ${establishment.name} (${establishment.category})`
        );

        // Find evaluators with matching specialty
        const matchingEvaluators = evaluators.filter((evaluator) =>
          evaluator.specialties.includes(establishment.category)
        );

        if (matchingEvaluators.length < 2) {
          console.log(`❌ Not enough evaluators for ${establishment.category}`);
          failedAssignments.push({
            establishment,
            reason: `Not enough evaluators with specialty "${establishment.category}". Need 2, found ${matchingEvaluators.length}.`,
          });
          continue;
        }

        // Sort by least assignments first (load balancing)
        const sortedEvaluators = matchingEvaluators.sort((a, b) => {
          const aCount = evaluatorAssignmentCounts.get(a.id) || 0;
          const bCount = evaluatorAssignmentCounts.get(b.id) || 0;
          return aCount - bCount;
        });

        // Select top 2 evaluators
        const evaluator1 = sortedEvaluators[0];
        const evaluator2 = sortedEvaluators[1];

        // Create assignment
        const assignmentRef = db.ref("assignments").push();
        const assignmentId = assignmentRef.key!;

        const newAssignment: Omit<Assignment, "id"> = {
          establishmentId: establishment.id,
          evaluator1Id: evaluator1.id,
          evaluator2Id: evaluator2.id,
          status: "pending",
          assignedAt: new Date().toISOString(),
        };

        await assignmentRef.set(newAssignment);

        // Update assignment counts
        evaluatorAssignmentCounts.set(
          evaluator1.id,
          (evaluatorAssignmentCounts.get(evaluator1.id) || 0) + 1
        );
        evaluatorAssignmentCounts.set(
          evaluator2.id,
          (evaluatorAssignmentCounts.get(evaluator2.id) || 0) + 1
        );

        const detailedAssignment: AssignmentWithDetails = {
          id: assignmentId,
          ...newAssignment,
          establishment,
          evaluator1,
          evaluator2,
        };

        successfulAssignments.push(detailedAssignment);

        console.log(`✅ Assigned: ${evaluator1.name} & ${evaluator2.name}`);
      } catch (error: any) {
        console.error(
          `❌ Error assigning ${establishment.name}:`,
          error.message
        );
        failedAssignments.push({
          establishment,
          reason: error.message,
        });
      }
    }

    // Generate summary report
    const evaluatorSummary = evaluators.map((evaluator) => ({
      name: evaluator.name,
      specialties: evaluator.specialties,
      assignedCount: evaluatorAssignmentCounts.get(evaluator.id) || 0,
    }));

    const categorySummary = establishments.reduce(
      (acc, est) => {
        acc[est.category] = (acc[est.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    console.log("\n📈 Assignment Summary:");
    console.log(`✅ Successful: ${successfulAssignments.length}`);
    console.log(`❌ Failed: ${failedAssignments.length}`);

    return NextResponse.json({
      message: "Auto-assignment completed",
      summary: {
        totalEstablishments: establishments.length,
        successfulAssignments: successfulAssignments.length,
        failedAssignments: failedAssignments.length,
        evaluatorSummary,
        categorySummary,
      },
      assignments: successfulAssignments,
      failures: failedAssignments,
    });
  } catch (error: any) {
    console.error("❌ Error in auto-assignment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - Get assignment statistics and validation
export async function GET() {
  try {
    const [evaluatorsSnap, establishmentsSnap, assignmentsSnap] =
      await Promise.all([
        db.ref("evaluators").once("value"),
        db.ref("establishments").once("value"),
        db.ref("assignments").once("value"),
      ]);

    const evaluators: Evaluator[] = evaluatorsSnap.exists()
      ? Object.entries(evaluatorsSnap.val()).map(
          ([id, data]: [string, any]) => ({ id, ...data })
        )
      : [];

    const establishments: Establishment[] = establishmentsSnap.exists()
      ? Object.entries(establishmentsSnap.val()).map(
          ([id, data]: [string, any]) => ({ id, ...data })
        )
      : [];

    const assignments: Assignment[] = assignmentsSnap.exists()
      ? Object.entries(assignmentsSnap.val()).map(
          ([id, data]: [string, any]) => ({ id, ...data })
        )
      : [];

    // Calculate statistics
    const evaluatorAssignmentCounts = new Map<string, number>();
    assignments.forEach((assignment) => {
      evaluatorAssignmentCounts.set(
        assignment.evaluator1Id,
        (evaluatorAssignmentCounts.get(assignment.evaluator1Id) || 0) + 1
      );
      evaluatorAssignmentCounts.set(
        assignment.evaluator2Id,
        (evaluatorAssignmentCounts.get(assignment.evaluator2Id) || 0) + 1
      );
    });

    const evaluatorStats = evaluators.map((evaluator) => ({
      id: evaluator.id,
      name: evaluator.name,
      specialties: evaluator.specialties,
      assignedCount: evaluatorAssignmentCounts.get(evaluator.id) || 0,
    }));

    // Check for unassigned establishments
    const assignedEstablishmentIds = new Set(
      assignments.map((a) => a.establishmentId)
    );
    const unassignedEstablishments = establishments.filter(
      (e) => !assignedEstablishmentIds.has(e.id)
    );

    // Validate constraints
    const violations: string[] = [];

    // Check for duplicate evaluators in same assignment
    assignments.forEach((assignment) => {
      if (assignment.evaluator1Id === assignment.evaluator2Id) {
        violations.push(`Assignment ${assignment.id} has duplicate evaluators`);
      }
    });

    return NextResponse.json({
      statistics: {
        totalEvaluators: evaluators.length,
        totalEstablishments: establishments.length,
        totalAssignments: assignments.length,
        unassignedEstablishments: unassignedEstablishments.length,
      },
      evaluatorStats,
      unassignedEstablishments,
      violations,
      isValid: violations.length === 0,
    });
  } catch (error: any) {
    console.error("❌ Error getting statistics:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
