import admin, { db } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

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

    const requestRef = db.ref("reportRequests").push();
    await requestRef.set({
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

    return NextResponse.json({ success: true, id: requestRef.key });
  } catch (error) {
    console.error("[ReportRequests] Error:", error);
    return NextResponse.json(
      { error: "Failed to submit report request." },
      { status: 500 },
    );
  }
}
