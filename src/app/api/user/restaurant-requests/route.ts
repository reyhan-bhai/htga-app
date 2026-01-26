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

    const requestId = await getNextRequestId(
      "counters/restaurantRequests",
      "RQST",
    );
    const requestRef = db.ref(`restaurantRequests/${requestId}`);
    await requestRef.set({
      id: requestId,
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

    return NextResponse.json({ success: true, id: requestId });
  } catch (error) {
    console.error("[RestaurantRequests] Error:", error);
    return NextResponse.json(
      { error: "Failed to submit restaurant request." },
      { status: 500 },
    );
  }
}
