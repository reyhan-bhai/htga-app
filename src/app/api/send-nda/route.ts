import { NextRequest, NextResponse } from "next/server";
import {
  getDocuSignAccessToken,
  getAccountId,
  getBasePath,
} from "@/lib/docusign-config";
import { db } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { recipientEmail, recipientName, documentBase64 } =
      await request.json();

    // Validate input
    if (!recipientEmail || !recipientName || !documentBase64) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: recipientEmail, recipientName, documentBase64",
        },
        { status: 400 }
      );
    }

    // Find evaluator by email in Firebase
    const evaluatorsSnapshot = await db.ref("evaluators").once("value");
    const evaluators = evaluatorsSnapshot.val();

    if (!evaluators) {
      return NextResponse.json(
        {
          success: false,
          error: "No evaluators found in database",
        },
        { status: 404 }
      );
    }

    // Search for evaluator with matching email
    let evaluatorId: string | null = null;
    for (const [id, evaluator] of Object.entries(evaluators as any)) {
      const evalData = evaluator as any;
      if (evalData.email?.toLowerCase() === recipientEmail.toLowerCase()) {
        evaluatorId = id;
        break;
      }
    }

    if (!evaluatorId) {
      return NextResponse.json(
        {
          success: false,
          error: `No evaluator found with email: ${recipientEmail}`,
        },
        { status: 404 }
      );
    }

    console.log(
      `📧 Found evaluator ${evaluatorId} for email ${recipientEmail}`
    );

    // Get access token
    const accessToken = await getDocuSignAccessToken();
    const accountId = getAccountId();
    const basePath = getBasePath();

    // Create envelope definition
    const envelopeDefinition = {
      emailSubject: "Please sign this NDA",
      status: "sent",
      documents: [
        {
          documentBase64: documentBase64,
          name: "NDA Agreement",
          fileExtension: "pdf",
          documentId: "1",
        },
      ],
      recipients: {
        signers: [
          {
            email: recipientEmail,
            name: recipientName,
            recipientId: "1",
            routingOrder: "1",
            tabs: {
              signHereTabs: [
                {
                  documentId: "1",
                  pageNumber: "1",
                  recipientId: "1",
                  tabLabel: "SignHereTab",
                  xPosition: "195",
                  yPosition: "147",
                },
              ],
            },
          },
        ],
      },
    };

    // Send envelope via REST API
    const response = await fetch(
      `${basePath}/v2.1/accounts/${accountId}/envelopes`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(envelopeDefinition),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `DocuSign API error: ${response.statusText}`
      );
    }

    const result = await response.json();

    // Save envelope info to Firebase
    const ndaRef = db.ref(`evaluators/${evaluatorId}/nda`);
    await ndaRef.set({
      envelopeId: result.envelopeId,
      status: "sent",
      sentAt: new Date().toISOString(),
      recipientEmail: recipientEmail,
      recipientName: recipientName,
      lastUpdated: new Date().toISOString(),
    });

    console.log(`✅ NDA sent and saved to evaluator ${evaluatorId}`);

    return NextResponse.json({
      success: true,
      envelopeId: result.envelopeId,
      evaluatorId: evaluatorId,
      message: "NDA sent successfully",
    });
  } catch (error: any) {
    console.error("DocuSign error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to send NDA",
      },
      { status: 500 }
    );
  }
}
