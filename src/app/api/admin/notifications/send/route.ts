import {
  createErrorResponse,
  createValidationError,
} from "@/lib/api-error-handler";
import { sendNotificationEmail } from "@/lib/emailService";
import admin, { db } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, userId, title, message, url } = body;

    if (!title || !message) {
      return createValidationError(
        !title ? "title" : "message",
        "Both title and message are required for notifications",
        "/api/admin/notifications/send",
      );
    }

    const results: any = {
      fcm: { success: false, status: "skipped" },
      email: { success: false, status: "skipped" },
      whatsapp: { success: false, status: "skipped" },
    };

    // 1. FCM Notification (Priority)
    if (token) {
      try {
        console.log(`📲 Sending FCM to token: ${token}`);
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
        results.fcm = { success: true, status: "sent" };
        console.log("✅ FCM sent successfully");
      } catch (error: any) {
        console.error("❌ Error sending FCM:", error);
        results.fcm = {
          success: false,
          status: "failed",
          error: error.message,
        };
      }
    }

    // 2. Fetch User Data for Email & WhatsApp
    if (userId) {
      try {
        console.log(`🔍 Fetching user data for: ${userId}`);
        const userSnapshot = await db.ref(`evaluators/${userId}`).once("value");

        if (userSnapshot.exists()) {
          const userData = userSnapshot.val();
          const { email } = userData;

          // Send Email
          if (email) {
            console.log(`📧 Sending email to: ${email}`);
            const emailResult = await sendNotificationEmail(
              email,
              title,
              message,
              `
              <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
                <div style="background: linear-gradient(135deg, #A67C37 0%, #8B6B30 100%); padding: 20px; border-radius: 8px 8px 0 0; color: white; text-align: center;">
                  <h2 style="margin: 0;">${title}</h2>
                </div>
                <div style="padding: 20px; background: #f9f9f9;">
                  <p style="font-size: 16px; line-height: 1.5;">${message}</p>
                  ${
                    url
                      ? `<div style="text-align: center; margin-top: 30px;">
                          <a href="${url}" style="background: #A67C37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Open in App</a>
                         </div>`
                      : ""
                  }
                </div>
                <div style="padding: 15px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee;">
                  <p>HTGA Notification System</p>
                </div>
              </div>
              `,
            );
            results.email = {
              ...emailResult,
              status: emailResult.success ? "sent" : "failed",
            };
          } else {
            results.email = {
              success: false,
              status: "failed",
              error: "No email found for user",
            };
          }
        } else {
          console.log("❌ User not found in database");
          results.userFetch = { success: false, error: "User not found" };
        }
      } catch (error: any) {
        console.error("❌ Error processing user data:", error);
        results.userFetch = { success: false, error: error.message };
      }
    }

    return NextResponse.json({
      success: true,
      message: "Notification process completed",
      results,
    });
  } catch (error: unknown) {
    return createErrorResponse(error, {
      operation: "POST /api/admin/notifications/send",
      resourceType: "Notification",
      path: "/api/admin/notifications/send",
    });
  }
}
