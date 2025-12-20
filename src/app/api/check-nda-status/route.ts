import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import {
  getDocuSignAccessToken,
  getAccountId,
  getBasePath,
} from "@/lib/docusign-config";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const evaluatorId = searchParams.get("evaluatorId");
    const envelopeId = searchParams.get("envelopeId");

    if (!evaluatorId && !envelopeId) {
      return NextResponse.json(
        {
          success: false,
          error: "Either evaluatorId or envelopeId is required",
        },
        { status: 400 }
      );
    }

    let ndaData: any = null;
    let evaluatorIdToUse = evaluatorId;

    // If envelopeId provided, find the evaluator
    if (envelopeId && !evaluatorId) {
      const evaluatorsSnapshot = await db.ref("evaluators").once("value");
      const evaluators = evaluatorsSnapshot.val();

      if (evaluators) {
        for (const [evalId, evaluator] of Object.entries(evaluators as any)) {
          const evalData = evaluator as any;
          if (evalData.nda?.envelopeId === envelopeId) {
            evaluatorIdToUse = evalId;
            ndaData = evalData.nda;
            break;
          }
        }
      }
    } else if (evaluatorId) {
      // Get NDA data from Firebase
      const ndaSnapshot = await db
        .ref(`evaluators/${evaluatorId}/nda`)
        .once("value");
      ndaData = ndaSnapshot.val();
    }

    if (!ndaData) {
      return NextResponse.json(
        {
          success: false,
          error: "NDA not found for this evaluator",
        },
        { status: 404 }
      );
    }

    // Get live status from DocuSign API
    try {
      const accessToken = await getDocuSignAccessToken();
      const accountId = getAccountId();
      const basePath = getBasePath();
      const response = await fetch(
        `${basePath}/v2.1/accounts/${accountId}/envelopes/${ndaData.envelopeId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const envelopeData = await response.json();

        // Update Firebase with latest status if different
        const liveStatus = envelopeData.status;
        let ndaStatus = ndaData.status;

        if (liveStatus === "completed" && ndaStatus !== "signed") {
          ndaStatus = "signed";
          await db.ref(`evaluators/${evaluatorIdToUse}/nda`).update({
            status: "signed",
            lastUpdated: new Date().toISOString(),
            docusignStatus: liveStatus,
            completedAt:
              envelopeData.completedDateTime || new Date().toISOString(),
          });
        } else if (liveStatus === "declined" && ndaStatus !== "declined") {
          ndaStatus = "declined";
          await db.ref(`evaluators/${evaluatorIdToUse}/nda`).update({
            status: "declined",
            lastUpdated: new Date().toISOString(),
            docusignStatus: liveStatus,
          });
        } else if (liveStatus === "voided" && ndaStatus !== "voided") {
          ndaStatus = "voided";
          await db.ref(`evaluators/${evaluatorIdToUse}/nda`).update({
            status: "voided",
            lastUpdated: new Date().toISOString(),
            docusignStatus: liveStatus,
          });
        }

        return NextResponse.json({
          success: true,
          evaluatorId: evaluatorIdToUse,
          nda: {
            ...ndaData,
            status: ndaStatus,
            docusignStatus: liveStatus,
          },
          envelopeDetails: {
            status: envelopeData.status,
            sentDateTime: envelopeData.sentDateTime,
            deliveredDateTime: envelopeData.deliveredDateTime,
            completedDateTime: envelopeData.completedDateTime,
            declinedDateTime: envelopeData.declinedDateTime,
            voidedDateTime: envelopeData.voidedDateTime,
          },
        });
      }
    } catch (docusignError: any) {
      console.error("Error fetching from DocuSign:", docusignError);
      // If DocuSign API fails, return Firebase data
    }

    // Return Firebase data if DocuSign API is unavailable
    return NextResponse.json({
      success: true,
      evaluatorId: evaluatorIdToUse,
      nda: ndaData,
      source: "firebase",
    });
  } catch (error: any) {
    console.error("Check NDA status error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to check NDA status",
      },
      { status: 500 }
    );
  }
}
