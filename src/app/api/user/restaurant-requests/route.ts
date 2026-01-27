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

    const adminEmail =
      process.env.ADMIN_NOTIFICATION_EMAIL?.trim() ||
      process.env.GMAIL_FROM?.trim();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
    const feedbackUrl = appUrl ? `${appUrl}/admin/feedback` : "";

    if (adminEmail) {
      const subject = `New Restaurant Recommendation ${requestId}`;
      const text = `A new restaurant recommendation has been submitted by ${submitterName} (${evaluatorId}).\nRestaurant: ${restaurantName}\nCategory: ${category || "-"}\nAddress: ${address}\nNotes: ${body.notes || "-"}\n\nOpen the feedback page: ${feedbackUrl || "(app URL not configured)"}`;
      const html = `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <h2 style="color:#A67C37;">New Restaurant Recommendation</h2>
          <p><strong>Request ID:</strong> ${requestId}</p>
          <p><strong>Evaluator:</strong> ${submitterName} (${evaluatorId})</p>
          <p><strong>Restaurant:</strong> ${restaurantName}</p>
          <p><strong>Category:</strong> ${category || "-"}</p>
          <p><strong>Address:</strong> ${address}</p>
          <p><strong>Notes:</strong> ${body.notes || "-"}</p>
          <p style="margin-top: 24px;">
            <a href="${feedbackUrl}" style="background:#A67C37;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;display:inline-block;">
              Open Feedback Page
            </a>
          </p>
        </div>
      `.trim();

      await sendNotificationEmail(adminEmail, subject, text, html);
    } else {
      console.warn("[RestaurantRequests] ADMIN_NOTIFICATION_EMAIL not set.");
    }

    return NextResponse.json({ success: true, id: requestId });
  } catch (error) {
    console.error("[RestaurantRequests] Error:", error);
    return NextResponse.json(
      { error: "Failed to submit restaurant request." },
      { status: 500 },
    );
  }
}
