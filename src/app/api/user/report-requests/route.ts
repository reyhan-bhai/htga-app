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

    const requestId = await getNextRequestId("counters/reportRequests", "RPRT");
    const requestRef = db.ref(`reportRequests/${requestId}`);
    await requestRef.set({
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
    });

    return NextResponse.json({ success: true, id: requestId });
  } catch (error) {
    console.error("[ReportRequests] Error:", error);
    return NextResponse.json(
      { error: "Failed to submit report request." },
      { status: 500 },
    );
  }
}
