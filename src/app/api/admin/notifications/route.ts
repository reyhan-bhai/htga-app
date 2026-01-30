import {
  createErrorResponse,
  createNotFoundError,
  createValidationError,
} from "@/lib/api-error-handler";
import admin, { db } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

// Get all tokens from Firebase Realtime Database
async function getAllTokens(): Promise<{ token: string; userId: string }[]> {
  try {
    const evaluatorsRef = db.ref("evaluators");
    const snapshot = await evaluatorsRef.once("value");
    const allEvaluators = snapshot.val() || {};

    const tokens: { token: string; userId: string }[] = [];

    // Iterate through all evaluators and their fcmTokens
    Object.entries(allEvaluators).forEach(
      ([userId, evaluatorData]: [string, any]) => {
        if (
          evaluatorData &&
          evaluatorData.fcmTokens &&
          typeof evaluatorData.fcmTokens === "string"
        ) {
          tokens.push({
            token: evaluatorData.fcmTokens,
            userId: userId,
          });
        }
      },
    );

    return tokens;
  } catch (error) {
    console.error("Error getting tokens from database:", error);
    return [];
  }
}

// Remove invalid token from database
async function removeInvalidToken(userId: string): Promise<void> {
  try {
    await db.ref(`evaluators/${userId}/fcmTokens`).remove();
    console.log(`🗑️ Removed invalid token for user ${userId}`);
  } catch (error) {
    console.error("Error removing invalid token:", error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body) {
      return createValidationError(
        "body",
        "Request body is required",
        "/api/admin/notifications",
      );
    }

    if (!body.notificationTitle || !body.notificationBody) {
      return createValidationError(
        !body.notificationTitle ? "notificationTitle" : "notificationBody",
        "Both notificationTitle and notificationBody are required",
        "/api/admin/notifications",
      );
    }

    console.log("=== SENDING NOTIFICATION TO ALL SUBSCRIBERS ===");

    const tokenData = await getAllTokens();
    console.log(`Total subscribers: ${tokenData.length}`);

    if (tokenData.length === 0) {
      return createNotFoundError(
        "FCM Tokens",
        "subscribers",
        "/api/admin/notifications",
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
    const tokens = tokenData.map((t) => t.token);
    const results = await admin.messaging().sendEachForMulticast({
      tokens: tokens,
      notification: payload.notification,
      data: payload.data,
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
          link: body.url || "/",
        },
      },
    });

    console.log(`✅ Successfully sent: ${results.successCount}`);
    console.log(`❌ Failed: ${results.failureCount}`);

    // Hapus token yang invalid dari database
    if (results.failureCount > 0) {
      const removePromises = results.responses
        .map((response, index) => {
          if (!response.success) {
            return removeInvalidToken(tokenData[index].userId);
          }
          return null;
        })
        .filter((p) => p !== null);

      await Promise.all(removePromises);
      console.log(`🗑️ Removed ${results.failureCount} invalid tokens`);
    }

    return NextResponse.json({
      message: "Notification sent to all subscribers",
      successCount: results.successCount,
      failureCount: results.failureCount,
      totalSubscribers: tokenData.length,
    });
  } catch (error: unknown) {
    return createErrorResponse(error, {
      operation: "POST /api/admin/notifications (Broadcast Notification)",
      resourceType: "FCM Notification",
      path: "/api/admin/notifications",
    });
  }
}
