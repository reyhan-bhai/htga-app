import admin, { db } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

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

    const requestRef = db.ref("reassignRequests").push();
    await requestRef.set({
      date: new Date().toISOString(),
      evaluator_id: evaluatorId,
      evaluator_name: evaluatorName,
      assign_id: assignId,
      restaurant_name: restaurantName,
      reason: reason || "-",
      status: "Pending",
      createdAt: admin.database.ServerValue.TIMESTAMP,
    });

    return NextResponse.json({ success: true, id: requestRef.key });
  } catch (error) {
    console.error("[ReassignRequests] Error:", error);
    return NextResponse.json(
      { error: "Failed to submit reassign request." },
      { status: 500 },
    );
  }
}
