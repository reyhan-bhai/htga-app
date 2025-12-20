import { NextRequest, NextResponse } from "next/server";
import { sendNDA, checkNDAStatus, processWebhook } from "@/lib/nda-service";

/**
 * POST /api/nda
 * Unified NDA endpoint - auto-detects operation type
 *
 * Send NDA Request (default if recipientEmail is present):
 * {
 *   "recipientEmail": "evaluator@gmail.com",
 *   "recipientName": "John Doe",
 *   "documentBase64": "JVBERi0xLjQK..."
 * }
 *
 * Webhook Request (auto-detected if event/data is present):
 * {
 *   "event": "envelope-completed",
 *   "data": { "envelopeId": "...", "status": "completed" }
 * }
 *
 * Explicit action (optional):
 * {
 *   "action": "send",
 *   "recipientEmail": "...",
 *   ...
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Auto-detect operation type
    let action = body.action;

    if (!action) {
      // If has recipientEmail, recipientName, documentBase64 -> Send NDA
      if (body.recipientEmail && body.recipientName && body.documentBase64) {
        action = "send";
      }
      // If has event and data fields -> Webhook
      else if (body.event && body.data) {
        action = "webhook";
      }
      // Default to send if recipientEmail exists
      else if (body.recipientEmail) {
        action = "send";
      }
    }

    // Handle different actions
    if (action === "send") {
      // Send NDA
      const result = await sendNDA({
        recipientEmail: body.recipientEmail,
        recipientName: body.recipientName,
        documentBase64: body.documentBase64,
      });

      if (!result.success) {
        return NextResponse.json(result, {
          status: result.error?.includes("not found") ? 404 : 400,
        });
      }

      return NextResponse.json(result);
    } else if (action === "webhook") {
      // Process DocuSign webhook
      const result = await processWebhook(body);

      if (!result.success) {
        return NextResponse.json(result, { status: 400 });
      }

      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid request. Provide recipientEmail/recipientName/documentBase64 to send NDA, or event/data for webhook",
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("❌ NDA API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/nda
 * Check NDA status with live DocuSign sync
 *
 * Query params:
 * - evaluatorId: string (optional)
 * - envelopeId: string (optional)
 *
 * At least one parameter is required
 *
 * Examples:
 * GET /api/nda?evaluatorId=jeva13
 * GET /api/nda?envelopeId=abc123-envelope-id
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const evaluatorId = searchParams.get("evaluatorId") || undefined;
    const envelopeId = searchParams.get("envelopeId") || undefined;

    const result = await checkNDAStatus(evaluatorId, envelopeId);

    if (!result.success) {
      return NextResponse.json(result, {
        status: result.error?.includes("not found") ? 404 : 400,
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ Check NDA status API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/nda
 * Alternative endpoint for DocuSign webhook (some systems prefer PUT)
 */
export async function PUT(request: NextRequest) {
  return POST(request);
}

/**
 * PATCH /api/nda
 * Health check endpoint
 */
export async function PATCH(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "NDA API is active",
    endpoints: {
      "POST /api/nda": "Send NDA or process webhook",
      "GET /api/nda": "Check NDA status",
    },
  });
}
