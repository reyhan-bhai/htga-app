import admin from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, title, message, url } = body;

    if (!token) {
      return NextResponse.json(
        { error: "FCM Token is required" },
        { status: 400 }
      );
    }

    if (!title || !message) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 }
      );
    }

    console.log(`Sending notification to token: ${token}`);

    const payload = {
      notification: {
        title: title,
        body: message,
      },
      data: url ? { url: url } : undefined,
      token: token,
      webpush: {
        notification: {
          actions: [
            {
              action: "open_url",
              title: "Open App",
            },
          ],
        },
        fcmOptions: {
          link: url || "/",
        },
      },
    };

    await admin.messaging().send(payload);

    return NextResponse.json({
      success: true,
      message: "Notification sent successfully",
    });
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send notification" },
      { status: 500 }
    );
  }
}
