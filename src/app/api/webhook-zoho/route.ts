import { db } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log("Zoho Webhook Payload:", JSON.stringify(payload, null, 2));

    const { assignment_id, evaluator_id } = payload;

    if (!assignment_id || !evaluator_id) {
      return NextResponse.json(
        { error: "Missing assignment_id or evaluator_id" },
        { status: 400 }
      );
    }

    // 1. Get the assignment
    const assignmentRef = db.ref(`assignments/${assignment_id}`);
    const assignmentSnap = await assignmentRef.once("value");

    if (!assignmentSnap.exists()) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    const assignment = assignmentSnap.val();
    const updates: any = {};

    // 2. Check which evaluator completed the assignment and update status
    if (assignment.evaluator1Id === evaluator_id) {
      updates.evaluator1Status = "completed";
    } else if (assignment.evaluator2Id === evaluator_id) {
      updates.evaluator2Status = "completed";
    } else {
      console.log("Evaluator Mismatch:", {
        received: evaluator_id,
        expected1: assignment.evaluator1Id,
        expected2: assignment.evaluator2Id,
      });
      return NextResponse.json(
        { error: "Evaluator ID does not match this assignment" },
        { status: 400 }
      );
    }

    // 3. Check if both are completed to set completedAt
    const newEval1Status =
      updates.evaluator1Status || assignment.evaluator1Status;
    const newEval2Status =
      updates.evaluator2Status || assignment.evaluator2Status;

    if (newEval1Status === "completed" && newEval2Status === "completed") {
      updates.completedAt = new Date().toISOString();
    }

    // 4. Update the assignment in Firebase
    await assignmentRef.update(updates);

    return NextResponse.json({
      message: "Assignment updated successfully",
      updates,
    });
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
