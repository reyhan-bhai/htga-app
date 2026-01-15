import { NextRequest, NextResponse } from "next/server";
import { sendNDA, checkNDAStatus, processWebhook } from "@/lib/nda-service";

// ============================================
// TYPES & INTERFACES
// ============================================

type NDAction = "send" | "webhook" | "unknown";

interface RequestBody {
  action?: string;
  recipientEmail?: string;
  recipientName?: string;
  documentBase64?: string;
  event?: string;
  data?: any;
  envelopeId?: string;
  status?: string;
  EnvelopeStatus?: any;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Detect operation type from request body
 */
function detectAction(body: RequestBody): NDAction {
  // Explicit action provided
  if (body.action) {
    return body.action === "send" || body.action === "webhook"
      ? body.action
      : "unknown";
  }

  // Send NDA: has recipient data
  if (body.recipientEmail && body.recipientName && body.documentBase64) {
    return "send";
  }

  // Webhook formats
  if (
    (body.event && body.data) || // Format 1: event/data
    (body.envelopeId && body.status) || // Format 2: direct envelope
    body.EnvelopeStatus // Format 3: DocuSign Connect
  ) {
    return "webhook";
  }

  return "unknown";
}

/**
 * Log request details for debugging
 */
function logRequest(method: string, body: any, headers: Headers) {
  console.log("\n🌐 ============================================");
  console.log(`🌐 ${method} /api/nda - Request received`);
  console.log("🌐 Timestamp:", new Date().toISOString());
  console.log("🌐 Headers:", {
    "content-type": headers.get("content-type"),
    "user-agent": headers.get("user-agent"),
  });
  console.log("🌐 Body:", JSON.stringify(body, null, 2));
  console.log("🌐 ============================================\n");
}

/**
 * Create error response
 */
function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

/**
 * Create success response
 */
function successResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}

// ============================================
// API ROUTES
// ============================================

/**
 * POST /api/nda
 *
 * Unified endpoint for:
 * 1. Sending NDA documents
 * 2. Receiving DocuSign webhooks
 *
 * @example Send NDA
 * POST /api/nda
 * {
 *   "recipientEmail": "user@example.com",
 *   "recipientName": "John Doe",
 *   "documentBase64": "JVBERi0..."
 * }
 *
 * @example DocuSign Webhook
 * POST /api/nda
 * {
 *   "envelopeId": "abc123",
 *   "status": "completed"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    logRequest("POST", body, request.headers);

    const action = detectAction(body);
    console.log(`🎯 Detected action: ${action}`);

    switch (action) {
      case "send":
        return await handleSendNDA(body);

      case "webhook":
        return await handleWebhook(body);

      default:
        return errorResponse(
          "Invalid request. Provide recipientEmail/recipientName/documentBase64 for sending NDA, " +
            "or envelopeId/status for webhook.",
          400
        );
    }
  } catch (error: any) {
    console.error("❌ POST /api/nda error:", error.message);
    console.error("Stack:", error.stack);
    return errorResponse(error.message || "Internal server error", 500);
  }
}

/**
 * GET /api/nda
 *
 * Check NDA status with optional live sync from DocuSign
 *
 * @example Check status
 * GET /api/nda?evaluatorId=jeva15
 *
 * @example Check by envelope
 * GET /api/nda?envelopeId=abc123
 *
 * @example Force sync from DocuSign
 * GET /api/nda?evaluatorId=jeva15&sync=true
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const evaluatorId = searchParams.get("evaluatorId") || undefined;
    const envelopeId = searchParams.get("envelopeId") || undefined;
    const forceSync = searchParams.get("sync") === "true";

    console.log("\n🔍 GET /api/nda - Check NDA Status");
    console.log("📋 Evaluator ID:", evaluatorId || "N/A");
    console.log("📋 Envelope ID:", envelopeId || "N/A");
    console.log("🔄 Force Sync:", forceSync);

    if (!evaluatorId && !envelopeId) {
      return errorResponse("Provide evaluatorId or envelopeId parameter", 400);
    }

    const result = await checkNDAStatus(evaluatorId, envelopeId);

    if (!result.success) {
      const status = result.error?.includes("not found") ? 404 : 400;
      return errorResponse(result.error || "Failed to check status", status);
    }

    console.log("✅ Status check successful");
    return successResponse(result);
  } catch (error: any) {
    console.error("❌ GET /api/nda error:", error.message);
    return errorResponse(error.message || "Internal server error", 500);
  }
}

/**
 * PUT /api/nda
 * Alternative webhook endpoint (some systems prefer PUT)
 */
export async function PUT(request: NextRequest) {
  return POST(request);
}

/**
 * PATCH /api/nda
 * Health check and API documentation
 */
export async function PATCH() {
  return successResponse({
    success: true,
    message: "NDA API is active",
    version: "2.0",
    endpoints: {
      "POST /api/nda": {
        description: "Send NDA or process webhook",
        examples: [
          "Send: { recipientEmail, recipientName, documentBase64 }",
          "Webhook: { envelopeId, status }",
        ],
      },
      "GET /api/nda": {
        description: "Check NDA status",
        parameters: [
          "evaluatorId: string (optional)",
          "envelopeId: string (optional)",
          "sync: boolean (optional, force sync from DocuSign)",
        ],
      },
    },
  });
}

// ============================================
// OPERATION HANDLERS
// ============================================

/**
 * Handle sending NDA document
 */
async function handleSendNDA(body: RequestBody) {
  const { recipientEmail, recipientName, documentBase64 } = body;

  if (!recipientEmail || !recipientName || !documentBase64) {
    return errorResponse(
      "Missing required fields: recipientEmail, recipientName, documentBase64"
    );
  }

  console.log("📧 Processing send NDA request...");
  const result = await sendNDA({
    recipientEmail,
    recipientName,
    documentBase64,
  });

  if (!result.success) {
    const status = result.error?.includes("not found") ? 404 : 400;
    return errorResponse(result.error || "Failed to send NDA", status);
  }

  console.log("✅ NDA sent successfully");
  return successResponse(result);
}

/**
 * Handle DocuSign webhook
 */
async function handleWebhook(body: RequestBody) {
  console.log("🔔 Processing webhook...");

  const result = await processWebhook(body);

  if (!result.success) {
    console.error("❌ Webhook processing failed:", result.error);
    return errorResponse(result.error || "Failed to process webhook", 400);
  }

  console.log("✅ Webhook processed successfully");
  return successResponse(result);
}
