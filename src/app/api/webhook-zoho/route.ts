import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log("Zoho Webhook Payload:", JSON.stringify(payload, null, 2));

    return NextResponse.json({ message: "Webhook received successfully" });
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
