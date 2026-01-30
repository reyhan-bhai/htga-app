import {
  createErrorResponse,
  createNotFoundError,
  createValidationError,
} from "@/lib/api-error-handler";
import { db } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log("Zoho Webhook Payload:", JSON.stringify(payload, null, 2));

    const { assignment_id, evaluator_id } = payload;

    if (!assignment_id || !evaluator_id) {
      return createValidationError(
        !assignment_id ? "assignment_id" : "evaluator_id",
        `Missing required field: ${!assignment_id ? "assignment_id" : "evaluator_id"}`,
        "/api/admin/webhook-zoho",
      );
    }

    // 1. Get the assignment
    const assignmentRef = db.ref(`assignments/${assignment_id}`);
    const assignmentSnap = await assignmentRef.once("value");

    if (!assignmentSnap.exists()) {
      return createNotFoundError(
        "Assignment",
        assignment_id,
        "/api/admin/webhook-zoho",
      );
    }

    const assignment = assignmentSnap.val();
    const updates: any = {};

    // 2. Check which evaluator submitted the assignment and update status
    if (assignment.evaluator1Id === evaluator_id) {
      updates.evaluator1Status = "submitted";
    } else if (assignment.evaluator2Id === evaluator_id) {
      updates.evaluator2Status = "submitted";
    } else {
      console.log("Evaluator Mismatch:", {
        received: evaluator_id,
        expected1: assignment.evaluator1Id,
        expected2: assignment.evaluator2Id,
      });
      return createValidationError(
        "evaluator_id",
        `Evaluator ID '${evaluator_id}' does not match this assignment. Expected: '${assignment.evaluator1Id}' or '${assignment.evaluator2Id}'`,
        "/api/admin/webhook-zoho",
      );
    }

    // 3. Check if both are submitted to set submittedAt
    const newEval1Status =
      updates.evaluator1Status || assignment.evaluator1Status;
    const newEval2Status =
      updates.evaluator2Status || assignment.evaluator2Status;

    if (newEval1Status === "submitted" && newEval2Status === "submitted") {
      updates.completedAt = new Date().toISOString();
    }

    // 4. Update the assignment in Firebase
    await assignmentRef.update(updates);

    return NextResponse.json({
      message: "Assignment updated successfully",
      updates,
    });
  } catch (error: unknown) {
    return createErrorResponse(error, {
      operation: "POST /api/admin/webhook-zoho",
      resourceType: "Assignment",
      path: "/api/admin/webhook-zoho",
    });
  }
}
