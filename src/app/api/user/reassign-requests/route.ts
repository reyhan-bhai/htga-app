import admin, { db } from "@/lib/firebase-admin";
import { sendNotificationEmail } from "@/lib/emailService";
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

interface ReassignRequestPayload {
  evaluatorId: string;
  evaluatorName: string;
  assignId: string;
  restaurantName: string;
  reason: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as Partial<ReassignRequestPayload>;
    const { evaluatorId, evaluatorName, assignId, restaurantName, reason } =
      body;

    if (!evaluatorId || !evaluatorName || !assignId || !restaurantName) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 },
      );
    }

    if (await hasDuplicateRequest("reassignRequests", assignId, evaluatorId)) {
      return NextResponse.json(
        {
          error:
            "Duplicate reassign request for this evaluator and assignment.",
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
      "reassigned",
    );

    if (Object.keys(assignmentUpdates).length === 0) {
      return NextResponse.json(
        { error: "Evaluator does not match this assignment." },
        { status: 400 },
      );
    }

    const requestId = await getNextRequestId(
      "counters/reassignRequests",
      "RASN",
    );
    const requestPayload = {
      id: requestId,
      date: new Date().toISOString(),
      evaluator_id: evaluatorId,
      evaluator_name: evaluatorName,
      assign_id: assignId,
      restaurant_name: restaurantName,
      reason: reason || "-",
      status: "Pending",
      createdAt: admin.database.ServerValue.TIMESTAMP,
    };

    const updates: Record<string, unknown> = {
      [`reassignRequests/${requestId}`]: requestPayload,
    };

    Object.entries(assignmentUpdates).forEach(([key, value]) => {
      updates[`assignments/${assignId}/${key}`] = value;
    });

    await db.ref().update(updates);

    const adminEmail =
      process.env.ADMIN_NOTIFICATION_EMAIL?.trim() ||
      process.env.GMAIL_FROM?.trim();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
    const feedbackUrl = appUrl ? `${appUrl}/admin/feedback` : "";

    if (adminEmail) {
      const subject = `New Reassign Request ${requestId}`;
      const text = `A new reassign request has been submitted by ${evaluatorName} (${evaluatorId}).\nAssignment: ${assignId}\nRestaurant: ${restaurantName}\nReason: ${reason || "-"}\n\nOpen the feedback page: ${feedbackUrl || "(app URL not configured)"}`;
      const html = `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <h2 style="color:#A67C37;">New Reassign Request</h2>
          <p><strong>Request ID:</strong> ${requestId}</p>
          <p><strong>Evaluator:</strong> ${evaluatorName} (${evaluatorId})</p>
          <p><strong>Assignment ID:</strong> ${assignId}</p>
          <p><strong>Restaurant:</strong> ${restaurantName}</p>
          <p><strong>Reason:</strong> ${reason || "-"}</p>
          <p style="margin-top: 24px;">
            <a href="${feedbackUrl}" style="background:#A67C37;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;display:inline-block;">
              Open Feedback Page
            </a>
          </p>
        </div>
      `.trim();

      await sendNotificationEmail(adminEmail, subject, text, html);
    } else {
      console.warn("[ReassignRequests] ADMIN_NOTIFICATION_EMAIL not set.");
    }

    return NextResponse.json({ success: true, id: requestId });
  } catch (error) {
    console.error("[ReassignRequests] Error:", error);
    return NextResponse.json(
      { error: "Failed to submit reassign request." },
      { status: 500 },
    );
  }
}
