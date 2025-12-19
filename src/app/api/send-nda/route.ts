import { NextRequest, NextResponse } from "next/server";
import {
  getDocuSignAccessToken,
  getAccountId,
  getBasePath,
} from "@/lib/docusign-config";

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

    return NextResponse.json({
      success: true,
      envelopeId: result.envelopeId,
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
