import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    console.log("📩 DocuSign Webhook received:", payload);

    // DocuSign sends envelope status updates
    const { event, data } = payload;

    if (!event || !data) {
      return NextResponse.json(
        { success: false, error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    const envelopeId = data.envelopeSummary?.envelopeId || data.envelopeId;
    const status = data.envelopeSummary?.status || data.status;

    if (!envelopeId) {
      return NextResponse.json(
        { success: false, error: "No envelope ID in payload" },
        { status: 400 }
      );
    }

    console.log(`📝 Envelope ${envelopeId} status: ${status}`);

    // Find evaluator with this envelopeId
    const evaluatorsSnapshot = await db.ref("evaluators").once("value");
    const evaluators = evaluatorsSnapshot.val();

    if (!evaluators) {
      console.log("⚠️ No evaluators found");
      return NextResponse.json({
        success: true,
        message: "No evaluators to update",
      });
    }

    // Search for evaluator with matching envelopeId
    let targetEvaluatorId = null;
    for (const [evaluatorId, evaluator] of Object.entries(evaluators as any)) {
      const evalData = evaluator as any;
      if (evalData.nda?.envelopeId === envelopeId) {
        targetEvaluatorId = evaluatorId;
        break;
      }
    }

    if (!targetEvaluatorId) {
      console.log(`⚠️ No evaluator found for envelope ${envelopeId}`);
      return NextResponse.json({
        success: true,
        message: "Envelope not associated with any evaluator",
      });
    }

    // Map DocuSign status to our status
    let ndaStatus = "sent";
    if (status === "completed") {
      ndaStatus = "signed";
    } else if (status === "declined") {
      ndaStatus = "declined";
    } else if (status === "voided") {
      ndaStatus = "voided";
    } else if (status === "delivered") {
      ndaStatus = "delivered";
    }

    // Update NDA status in Firebase
    const ndaRef = db.ref(`evaluators/${targetEvaluatorId}/nda`);
    await ndaRef.update({
      status: ndaStatus,
      lastUpdated: new Date().toISOString(),
      docusignStatus: status,
      completedAt: status === "completed" ? new Date().toISOString() : null,
    });

    console.log(
      `✅ Updated evaluator ${targetEvaluatorId} NDA status to: ${ndaStatus}`
    );

    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
      evaluatorId: targetEvaluatorId,
      status: ndaStatus,
    });
  } catch (error: any) {
    console.error("❌ DocuSign webhook error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process webhook",
      },
      { status: 500 }
    );
  }
}

// GET endpoint for webhook validation (DocuSign may ping this)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "DocuSign webhook endpoint is active",
  });
}
