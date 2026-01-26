import admin, { db } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface RestaurantRequestPayload {
  evaluatorId: string;
  submitterName: string;
  restaurantName: string;
  category: string;
  address: string;
  notes?: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as Partial<RestaurantRequestPayload>;
    const { evaluatorId, submitterName, restaurantName, category, address } =
      body;

    if (!evaluatorId || !submitterName || !restaurantName || !address) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 },
      );
    }

    const requestRef = db.ref("restaurantRequests").push();
    await requestRef.set({
      date: new Date().toISOString(),
      evaluator_id: evaluatorId,
      submitter_name: submitterName,
      restaurant_name: restaurantName,
      category: category || "-",
      address,
      notes: body.notes || "-",
      status: "Pending",
      createdAt: admin.database.ServerValue.TIMESTAMP,
    });

    return NextResponse.json({ success: true, id: requestRef.key });
  } catch (error) {
    console.error("[RestaurantRequests] Error:", error);
    return NextResponse.json(
      { error: "Failed to submit restaurant request." },
      { status: 500 },
    );
  }
}
