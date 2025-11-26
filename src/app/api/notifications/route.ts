import { NextResponse } from "next/server";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKey || !clientEmail) {
    throw new Error("Missing Firebase Admin credentials");
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      privateKey: privateKey.replace(/\\n/g, "\n"),
      clientEmail,
    }),
  });
}

function getTokens(): string[] {
  const TOKENS_FILE = path.join(process.cwd(), "data", "tokens.json");
  if (!fs.existsSync(TOKENS_FILE)) {
    return [];
  }
  const data = fs.readFileSync(TOKENS_FILE, "utf-8");
  return JSON.parse(data);
}

function saveTokens(tokens: string[]) {
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const TOKENS_FILE = path.join(dir, "tokens.json");
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body) throw new Error("Request body is required");

    console.log("=== SENDING NOTIFICATION TO ALL SUBSCRIBERS ===");

    const tokens = getTokens();
    console.log(`Total subscribers: ${tokens.length}`);

    if (tokens.length === 0) {
      return NextResponse.json(
        { message: "No subscribers found" },
        { status: 404 }
      );
    }

    const payload = {
      notification: {
        title: body.notificationTitle,
        body: body.notificationBody,
      },
      data: body.url ? { url: body.url } : undefined,
    };

    // Kirim ke semua tokens
    const results = await admin.messaging().sendEachForMulticast({
      tokens: tokens,
      notification: payload.notification,
      data: payload.data,
    });

    console.log(`✅ Successfully sent: ${results.successCount}`);
    console.log(`❌ Failed: ${results.failureCount}`);

    // Hapus token yang invalid
    if (results.failureCount > 0) {
      const validTokens = tokens.filter((token, index) => {
        return results.responses[index].success;
      });
      saveTokens(validTokens);
      console.log(`🗑️ Removed ${results.failureCount} invalid tokens`);
    }

    return NextResponse.json({
      message: "Notification sent to all subscribers",
      successCount: results.successCount,
      failureCount: results.failureCount,
      totalSubscribers: tokens.length,
    });
  } catch (error: any) {
    console.error("❌ Error sending notification:", error);
    return NextResponse.json(
      { error: error.message, details: error },
      { status: 500 }
    );
  }
}
