import { db } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

// GET - Get specific assignment by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const snapshot = await db.ref(`assignments/${id}`).once("value");
    const assignment = snapshot.val();

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      assignment: { id, ...assignment },
    });
  } catch (error: any) {
    console.error("Error getting assignment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update assignment
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { evaluator1Id, evaluator2Id, status } = body;

    // Check if assignment exists
    const snapshot = await db.ref(`assignments/${id}`).once("value");
    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    const currentAssignment = snapshot.val();

    // Validate evaluators if provided
    if (evaluator1Id !== undefined && evaluator1Id !== null) {
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

    if (evaluator2Id !== undefined && evaluator2Id !== null) {
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

    // Build update object
    const updates: any = {
      ...currentAssignment,
      updatedAt: new Date().toISOString(),
    };

    if (evaluator1Id !== undefined) {
      updates.evaluator1Id = evaluator1Id;
    }

    if (evaluator2Id !== undefined) {
      updates.evaluator2Id = evaluator2Id;
    }

    if (status !== undefined) {
      updates.status = status;
    }

    // Update assignment
    await db.ref(`assignments/${id}`).set(updates);

    return NextResponse.json({
      message: "Assignment updated successfully",
      assignment: { id, ...updates },
    });
  } catch (error: any) {
    console.error("Error updating assignment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete assignment
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if assignment exists
    const snapshot = await db.ref(`assignments/${id}`).once("value");
    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Delete assignment
    await db.ref(`assignments/${id}`).remove();

    return NextResponse.json({
      message: "Assignment deleted successfully",
      id,
    });
  } catch (error: any) {
    console.error("Error deleting assignment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
