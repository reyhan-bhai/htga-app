// /**
//  * NDA Service - Centralized DocuSign NDA management
//  * Handles all NDA operations: sending, status checking, and webhook processing
//  */
// 
// import { db } from "@/lib/firebase-admin";
// import {
//   getDocuSignAccessToken,
//   getAccountId,
//   getBasePath,
// } from "@/lib/docusign-config";
// 
// // ========================
// // Types & Interfaces
// // ========================
// 
// export interface NDAData {
//   envelopeId: string;
//   status: "sent" | "delivered" | "signed" | "declined" | "voided";
//   sentAt: string;
//   recipientEmail: string;
//   recipientName: string;
//   lastUpdated: string;
//   docusignStatus?: string;
//   completedAt?: string;
//   deliveredAt?: string;
//   declinedAt?: string;
//   voidedAt?: string;
// }
// 
// export interface SendNDARequest {
//   recipientEmail: string;
//   recipientName: string;
//   documentBase64: string;
// }
// 
// export interface SendNDAResponse {
//   success: boolean;
//   envelopeId?: string;
//   evaluatorId?: string;
//   message?: string;
//   error?: string;
// }
// 
// export interface CheckStatusResponse {
//   success: boolean;
//   evaluatorId?: string;
//   nda?: NDAData;
//   envelopeDetails?: any;
//   source?: string;
//   docusignError?: string;
//   error?: string;
// }
// 
// export interface WebhookResponse {
//   success: boolean;
//   evaluatorId?: string;
//   status?: string;
//   message?: string;
//   error?: string;
// }
// 
// // ========================
// // Helper Functions
// // ========================
// 
// /**
//  * Find evaluator by email in Firebase
//  */
// export async function findEvaluatorByEmail(
//   email: string
// ): Promise<string | null> {
//   try {
//     const evaluatorsSnapshot = await db.ref("evaluators").once("value");
//     const evaluators = evaluatorsSnapshot.val();
// 
//     if (!evaluators) {
//       return null;
//     }
// 
//     for (const [id, evaluator] of Object.entries(evaluators as any)) {
//       const evalData = evaluator as any;
//       if (evalData.email?.toLowerCase() === email.toLowerCase()) {
//         return id;
//       }
//     }
// 
//     return null;
//   } catch (error) {
//     console.error("❌ Error finding evaluator by email:", error);
//     throw error;
//   }
// }
// 
// /**
//  * Find evaluator by envelope ID in Firebase
//  */
// export async function findEvaluatorByEnvelopeId(
//   envelopeId: string
// ): Promise<{ evaluatorId: string; ndaData: NDAData } | null> {
//   try {
//     const evaluatorsSnapshot = await db.ref("evaluators").once("value");
//     const evaluators = evaluatorsSnapshot.val();
// 
//     if (!evaluators) {
//       return null;
//     }
// 
//     for (const [evalId, evaluator] of Object.entries(evaluators as any)) {
//       const evalData = evaluator as any;
//       if (evalData.nda?.envelopeId === envelopeId) {
//         return {
//           evaluatorId: evalId,
//           ndaData: evalData.nda,
//         };
//       }
//     }
// 
//     return null;
//   } catch (error) {
//     console.error("❌ Error finding evaluator by envelope ID:", error);
//     throw error;
//   }
// }
// 
// /**
//  * Get NDA data from Firebase for a specific evaluator
//  */
// export async function getNDADataFromFirebase(
//   evaluatorId: string
// ): Promise<NDAData | null> {
//   try {
//     const ndaSnapshot = await db
//       .ref(`evaluators/${evaluatorId}/nda`)
//       .once("value");
//     return ndaSnapshot.val();
//   } catch (error) {
//     console.error("❌ Error getting NDA data from Firebase:", error);
//     throw error;
//   }
// }
// 
// /**
//  * Map DocuSign status to internal status
//  */
// export function mapDocuSignStatus(docusignStatus: string): NDAData["status"] {
//   switch (docusignStatus.toLowerCase()) {
//     case "completed":
//       return "signed";
//     case "declined":
//       return "declined";
//     case "voided":
//       return "voided";
//     case "delivered":
//       return "delivered";
//     case "sent":
//     default:
//       return "sent";
//   }
// }
// 
// /**
//  * Update NDA status in Firebase
//  */
// export async function updateNDAStatus(
//   evaluatorId: string,
//   status: NDAData["status"],
//   docusignStatus: string,
//   additionalData?: Partial<NDAData>
// ): Promise<void> {
//   try {
//     const updateData: any = {
//       status,
//       lastUpdated: new Date().toISOString(),
//       docusignStatus,
//       ...additionalData,
//     };
// 
//     // Add timestamp based on status
//     if (status === "signed") {
//       updateData.completedAt =
//         updateData.completedAt || new Date().toISOString();
//     } else if (status === "delivered") {
//       updateData.deliveredAt =
//         updateData.deliveredAt || new Date().toISOString();
//     } else if (status === "declined") {
//       updateData.declinedAt = updateData.declinedAt || new Date().toISOString();
//     } else if (status === "voided") {
//       updateData.voidedAt = updateData.voidedAt || new Date().toISOString();
//     }
// 
//     await db.ref(`evaluators/${evaluatorId}/nda`).update(updateData);
//     console.log(`✅ Updated evaluator ${evaluatorId} NDA status to: ${status}`);
//   } catch (error) {
//     console.error("❌ Error updating NDA status:", error);
//     throw error;
//   }
// }
// 
// /**
//  * Fetch envelope details from DocuSign API
//  */
// export async function fetchEnvelopeFromDocuSign(
//   envelopeId: string
// ): Promise<any> {
//   try {
//     const accessToken = await getDocuSignAccessToken();
//     const accountId = getAccountId();
//     const basePath = getBasePath();
// 
//     const docusignUrl = `${basePath}/v2.1/accounts/${accountId}/envelopes/${envelopeId}`;
// 
//     console.log("🔍 Fetching DocuSign envelope:");
//     console.log("  URL:", docusignUrl);
//     console.log("  Envelope ID:", envelopeId);
// 
//     const response = await fetch(docusignUrl, {
//       method: "GET",
//       headers: {
//         Authorization: `Bearer ${accessToken}`,
//         "Content-Type": "application/json",
//       },
//     });
// 
//     const responseText = await response.text();
// 
//     console.log("📡 DocuSign Response Status:", response.status);
//     console.log(
//       "📡 DocuSign Response (first 500 chars):",
//       responseText.substring(0, 500)
//     );
// 
//     if (!response.ok) {
//       let errorData;
//       try {
//         errorData = JSON.parse(responseText);
//       } catch {
//         errorData = { message: responseText };
//       }
// 
//       console.error("❌ DocuSign API Error:", errorData);
//       throw new Error(
//         errorData.message || errorData.errorCode || "DocuSign API error"
//       );
//     }
// 
//     const envelopeData = JSON.parse(responseText);
//     console.log("✅ Successfully fetched envelope data");
//     return envelopeData;
//   } catch (error) {
//     console.error("❌ Error fetching envelope from DocuSign:", error);
//     throw error;
//   }
// }
// 
// // ========================
// // Core NDA Operations
// // ========================
// 
// /**
//  * Send NDA via DocuSign
//  */
// export async function sendNDA(
//   request: SendNDARequest
// ): Promise<SendNDAResponse> {
//   try {
//     const { recipientEmail, recipientName, documentBase64 } = request;
// 
//     // Validate input
//     if (!recipientEmail || !recipientName || !documentBase64) {
//       return {
//         success: false,
//         error:
//           "Missing required fields: recipientEmail, recipientName, documentBase64",
//       };
//     }
// 
//     // Find evaluator by email
//     const evaluatorId = await findEvaluatorByEmail(recipientEmail);
// 
//     if (!evaluatorId) {
//       return {
//         success: false,
//         error: `No evaluator found with email: ${recipientEmail}`,
//       };
//     }
// 
//     console.log(
//       `📧 Found evaluator ${evaluatorId} for email ${recipientEmail}`
//     );
// 
//     // Get DocuSign credentials
//     const accessToken = await getDocuSignAccessToken();
//     const accountId = getAccountId();
//     const basePath = getBasePath();
// 
//     // Create envelope definition
//     const envelopeDefinition = {
//       emailSubject: "Please sign this NDA",
//       status: "sent",
//       documents: [
//         {
//           documentBase64: documentBase64,
//           name: "NDA Agreement",
//           fileExtension: "pdf",
//           documentId: "1",
//         },
//       ],
//       recipients: {
//         signers: [
//           {
//             email: recipientEmail,
//             name: recipientName,
//             recipientId: "1",
//             routingOrder: "1",
//             tabs: {
//               signHereTabs: [
//                 {
//                   documentId: "1",
//                   pageNumber: "1",
//                   recipientId: "1",
//                   tabLabel: "SignHereTab",
//                   xPosition: "195",
//                   yPosition: "147",
//                 },
//               ],
//             },
//           },
//         ],
//       },
//     };
// 
//     // Send envelope via DocuSign API
//     const response = await fetch(
//       `${basePath}/v2.1/accounts/${accountId}/envelopes`,
//       {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(envelopeDefinition),
//       }
//     );
// 
//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(
//         errorData.message || `DocuSign API error: ${response.statusText}`
//       );
//     }
// 
//     const result = await response.json();
// 
//     // Save envelope info to Firebase
//     await db.ref(`evaluators/${evaluatorId}/nda`).set({
//       envelopeId: result.envelopeId,
//       status: "sent",
//       sentAt: new Date().toISOString(),
//       recipientEmail: recipientEmail,
//       recipientName: recipientName,
//       lastUpdated: new Date().toISOString(),
//     });
// 
//     console.log(`✅ NDA sent and saved to evaluator ${evaluatorId}`);
// 
//     return {
//       success: true,
//       envelopeId: result.envelopeId,
//       evaluatorId: evaluatorId,
//       message: "NDA sent successfully",
//     };
//   } catch (error: any) {
//     console.error("❌ Send NDA error:", error);
//     return {
//       success: false,
//       error: error.message || "Failed to send NDA",
//     };
//   }
// }
// 
// /**
//  * Check NDA status with live DocuSign sync
//  */
// export async function checkNDAStatus(
//   evaluatorId?: string,
//   envelopeId?: string
// ): Promise<CheckStatusResponse> {
//   try {
//     console.log("🔍 Check NDA Status called with:");
//     console.log("  evaluatorId:", evaluatorId);
//     console.log("  envelopeId:", envelopeId);
// 
//     if (!evaluatorId && !envelopeId) {
//       return {
//         success: false,
//         error: "Either evaluatorId or envelopeId is required",
//       };
//     }
// 
//     let ndaData: NDAData | null = null;
//     let evaluatorIdToUse = evaluatorId;
// 
//     // Get NDA data from Firebase
//     if (evaluatorId) {
//       console.log(`📂 Getting NDA data for evaluator: ${evaluatorId}`);
//       ndaData = await getNDADataFromFirebase(evaluatorId);
//       console.log("📂 Firebase NDA data:", ndaData);
//     } else if (envelopeId) {
//       // Find evaluator by envelope ID
//       console.log(`🔎 Finding evaluator by envelope: ${envelopeId}`);
//       const result = await findEvaluatorByEnvelopeId(envelopeId);
//       if (result) {
//         evaluatorIdToUse = result.evaluatorId;
//         ndaData = result.ndaData;
//         console.log(`✅ Found evaluator: ${evaluatorIdToUse}`);
//       }
//     }
// 
//     if (!ndaData) {
//       console.error("❌ NDA data not found in Firebase");
//       return {
//         success: false,
//         error: "NDA not found for this evaluator",
//       };
//     }
// 
//     if (!ndaData.envelopeId) {
//       console.error("❌ No envelopeId in NDA data");
//       return {
//         success: false,
//         error: "No envelope ID found in NDA data",
//       };
//     }
// 
//     // Always fetch live status from DocuSign
//     try {
//       console.log(
//         `🌐 Fetching live status from DocuSign for envelope: ${ndaData.envelopeId}`
//       );
//       const envelopeData = await fetchEnvelopeFromDocuSign(ndaData.envelopeId);
// 
//       console.log("📊 DocuSign envelope data:", {
//         status: envelopeData.status,
//         sentDateTime: envelopeData.sentDateTime,
//         deliveredDateTime: envelopeData.deliveredDateTime,
//         completedDateTime: envelopeData.completedDateTime,
//       });
// 
//       // Map DocuSign status to internal status
//       const liveStatus = envelopeData.status;
//       const mappedStatus = mapDocuSignStatus(liveStatus);
// 
//       console.log(`🔄 Status mapping: ${liveStatus} → ${mappedStatus}`);
//       console.log(`📝 Current Firebase status: ${ndaData.status}`);
// 
//       // Build update payload - only include fields with values (no undefined)
//       const updatePayload: Partial<NDAData> = {};
// 
//       if (envelopeData.completedDateTime || ndaData.completedAt) {
//         updatePayload.completedAt =
//           envelopeData.completedDateTime || ndaData.completedAt;
//       }
//       if (envelopeData.deliveredDateTime || ndaData.deliveredAt) {
//         updatePayload.deliveredAt =
//           envelopeData.deliveredDateTime || ndaData.deliveredAt;
//       }
//       if (envelopeData.declinedDateTime || ndaData.declinedAt) {
//         updatePayload.declinedAt =
//           envelopeData.declinedDateTime || ndaData.declinedAt;
//       }
//       if (envelopeData.voidedDateTime || ndaData.voidedAt) {
//         updatePayload.voidedAt =
//           envelopeData.voidedDateTime || ndaData.voidedAt;
//       }
// 
//       console.log("📦 Update payload:", updatePayload);
// 
//       if (mappedStatus !== ndaData.status) {
//         console.log(
//           `✨ Status changed! Updating Firebase: ${ndaData.status} → ${mappedStatus}`
//         );
//         await updateNDAStatus(
//           evaluatorIdToUse!,
//           mappedStatus,
//           liveStatus,
//           updatePayload
//         );
//       } else {
//         console.log(
//           `ℹ️ Status unchanged (${mappedStatus}), but updating timestamps`
//         );
//         await updateNDAStatus(
//           evaluatorIdToUse!,
//           mappedStatus,
//           liveStatus,
//           updatePayload
//         );
//       }
// 
//       // Return latest data
//       return {
//         success: true,
//         evaluatorId: evaluatorIdToUse,
//         nda: {
//           ...ndaData,
//           status: mappedStatus,
//           docusignStatus: liveStatus,
//           ...updatePayload,
//         },
//         envelopeDetails: {
//           status: envelopeData.status,
//           sentDateTime: envelopeData.sentDateTime,
//           deliveredDateTime: envelopeData.deliveredDateTime,
//           completedDateTime: envelopeData.completedDateTime,
//           declinedDateTime: envelopeData.declinedDateTime,
//           voidedDateTime: envelopeData.voidedDateTime,
//         },
//       };
//     } catch (docusignError: any) {
//       console.error("❌ DocuSign API error:", docusignError.message);
//       console.error("Stack:", docusignError.stack);
// 
//       // Return Firebase data if DocuSign API fails
//       return {
//         success: true,
//         evaluatorId: evaluatorIdToUse,
//         nda: ndaData,
//         source: "firebase",
//         docusignError: docusignError.message,
//       };
//     }
//   } catch (error: any) {
//     console.error("❌ Check NDA status error:", error);
//     return {
//       success: false,
//       error: error.message || "Failed to check NDA status",
//     };
//   }
// }
// 
// /**
//  * Process DocuSign webhook event
//  */
// export async function processWebhook(payload: any): Promise<WebhookResponse> {
//   try {
//     console.log("📩 ============================================");
//     console.log("📩 DocuSign Webhook received");
//     console.log("📩 Full Payload:", JSON.stringify(payload, null, 2));
//     console.log("📩 ============================================");
// 
//     // DocuSign sends different formats, handle all cases
//     let envelopeId: string | undefined;
//     let status: string | undefined;
// 
//     // Format 1: Standard event/data format
//     if (payload.event && payload.data) {
//       envelopeId =
//         payload.data.envelopeSummary?.envelopeId || payload.data.envelopeId;
//       status = payload.data.envelopeSummary?.status || payload.data.status;
// 
//       // Fallback: derive status from event name if not in data
//       if (!status && payload.event && typeof payload.event === "string") {
//         status = payload.event.replace("envelope-", "");
//         console.log(
//           `ℹ️ Derived status '${status}' from event '${payload.event}'`
//         );
//       }
//     }
//     // Format 2: Direct envelope data
//     else if (payload.envelopeId) {
//       envelopeId = payload.envelopeId;
//       status = payload.status;
//     }
//     // Format 3: DocuSign Connect XML-to-JSON format
//     else if (payload.EnvelopeStatus) {
//       envelopeId = payload.EnvelopeStatus.EnvelopeID;
//       status = payload.EnvelopeStatus.Status;
//     }
// 
//     console.log("📝 Extracted - Envelope ID:", envelopeId);
//     console.log("📝 Extracted - Status:", status);
// 
//     if (!envelopeId || !status) {
//       console.error("❌ Missing envelope ID or status in webhook");
//       return {
//         success: false,
//         error: "Missing envelope ID or status in webhook payload",
//       };
//     }
// 
//     // Find evaluator with this envelopeId
//     console.log(`🔍 Finding evaluator for envelope: ${envelopeId}`);
//     const result = await findEvaluatorByEnvelopeId(envelopeId);
// 
//     if (!result) {
//       console.log(`⚠️ No evaluator found for envelope ${envelopeId}`);
//       return {
//         success: true,
//         message:
//           "Envelope not associated with any evaluator (might be test envelope)",
//       };
//     }
// 
//     const { evaluatorId, ndaData } = result;
//     console.log(`✅ Found evaluator: ${evaluatorId}`);
//     console.log(`📋 Current status in DB: ${ndaData.status}`);
// 
//     // Map DocuSign status to internal status
//     const mappedStatus = mapDocuSignStatus(status);
//     console.log(`🔄 Status mapping: ${status} → ${mappedStatus}`);
// 
//     // Update NDA status in Firebase
//     console.log(`💾 Updating Firebase for evaluator ${evaluatorId}...`);
//     await updateNDAStatus(evaluatorId, mappedStatus, status);
// 
//     console.log("✅ Webhook processed successfully!");
//     console.log("📩 ============================================");
// 
//     return {
//       success: true,
//       message: "Webhook processed and Firebase updated successfully",
//       evaluatorId: evaluatorId,
//       status: mappedStatus,
//     };
//   } catch (error: any) {
//     console.error("❌ Webhook processing error:", error);
//     console.error("Stack:", error.stack);
//     return {
//       success: false,
//       error: error.message || "Failed to process webhook",
//     };
//   }
// }
// 