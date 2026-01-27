import admin, { db } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const getNextRequestId = async (
  counterPath: string,
  prefix: string,
): Promise<string> => {
  const counterRef = db.ref(counterPath);
  const result = await counterRef.transaction((current) => (current || 0) + 1);
  if (!result.committed) {
    throw new Error("Failed to generate request ID.");
  }
  const nextValue = result.snapshot.val() as number;
  const padded = String(nextValue).padStart(2, "0");
  return `${prefix}-${padded}`;
};

const hasDuplicateRequest = async (
  path: string,
  assignId: string,
  evaluatorId: string,
): Promise<boolean> => {
  const snapshot = await db
    .ref(path)
    .orderByChild("assign_id")
    .equalTo(assignId)
    .once("value");

  if (!snapshot.exists()) {
    return false;
  }

  const data = snapshot.val() as Record<string, { evaluator_id?: string }>;
  return Object.values(data).some(
    (entry) => entry?.evaluator_id === evaluatorId,
  );
};

const buildAssignmentStatusUpdates = (
  assignment: Record<string, any>,
  evaluatorId: string,
  status: string,
): Record<string, string> => {
  const updates: Record<string, string> = {};

  if (assignment.evaluator1Id === evaluatorId) {
    updates.evaluator1Status = status;
  }

  if (assignment.evaluator2Id === evaluatorId) {
    updates.evaluator2Status = status;
  }

  const evaluators = assignment.evaluators || {};
  const jevaFirst = evaluators.JEVA_FIRST;
  const jevaSecond = evaluators.JEVA_SECOND;

  if (jevaFirst?.evaluatorId === evaluatorId) {
    updates["evaluators/JEVA_FIRST/status"] = status;
    updates["evaluators/JEVA_FIRST/evaluatorStatus"] = status;
  }

  if (jevaSecond?.evaluatorId === evaluatorId) {
    updates["evaluators/JEVA_SECOND/status"] = status;
    updates["evaluators/JEVA_SECOND/evaluatorStatus"] = status;
  }

  return updates;
};

interface ReportRequestPayload {
  evaluatorId: string;
  reporterName: string;
  assignId: string;
  restaurantName: string;
  issueType: string;
  description?: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as Partial<ReportRequestPayload>;
    const { evaluatorId, reporterName, assignId, restaurantName, issueType } =
      body;

    if (!evaluatorId || !reporterName || !assignId || !issueType) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 },
      );
    }

    if (await hasDuplicateRequest("reportRequests", assignId, evaluatorId)) {
      return NextResponse.json(
        {
          error: "Duplicate report request for this evaluator and assignment.",
        },
        { status: 409 },
      );
    }

    const assignmentRef = db.ref(`assignments/${assignId}`);
    const assignmentSnapshot = await assignmentRef.get();
    if (!assignmentSnapshot.exists()) {
      return NextResponse.json(
        { error: "Assignment not found." },
        { status: 404 },
      );
    }

    const assignmentData = assignmentSnapshot.val();
    const assignmentUpdates = buildAssignmentStatusUpdates(
      assignmentData,
      evaluatorId,
      "reported",
    );

    if (Object.keys(assignmentUpdates).length === 0) {
      return NextResponse.json(
        { error: "Evaluator does not match this assignment." },
        { status: 400 },
      );
    }

    const requestId = await getNextRequestId("counters/reportRequests", "RPRT");
    const requestPayload = {
      id: requestId,
      date: new Date().toISOString(),
      evaluator_id: evaluatorId,
      reporter_name: reporterName,
      assign_id: assignId,
      restaurant_name: restaurantName || "-",
      issue_type: issueType,
      description: body.description || "Reported by evaluator",
      status: "Open",
      createdAt: admin.database.ServerValue.TIMESTAMP,
    };

    const updates: Record<string, unknown> = {
      [`reportRequests/${requestId}`]: requestPayload,
    };

    Object.entries(assignmentUpdates).forEach(([key, value]) => {
      updates[`assignments/${assignId}/${key}`] = value;
    });

    await db.ref().update(updates);

    return NextResponse.json({ success: true, id: requestId });
  } catch (error) {
    console.error("[ReportRequests] Error:", error);
    return NextResponse.json(
      { error: "Failed to submit report request." },
      { status: 500 },
    );
  }
}
