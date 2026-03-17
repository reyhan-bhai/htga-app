// src/app/api/sheets/route.ts
import {
  createErrorResponse,
  createValidationError,
} from "@/lib/api-error-handler";
import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

const REQUIRED_SHEETS = [
  "List of Evaluators",
  "List of Eating Establishments",
  "Budget",
] as const;

const getRequiredEnv = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
};

const getSpreadsheetId = (): string =>
  getRequiredEnv("GOOGLE_SHEETS_SPREADSHEET_ID");

const ensureRequiredSheets = async (
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
): Promise<string[]> => {
  const metadata = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties.title",
  });

  const existingSheetTitles = new Set(
    (metadata.data.sheets || [])
      .map((sheet) => sheet.properties?.title)
      .filter((title): title is string => Boolean(title)),
  );

  const missingSheets = REQUIRED_SHEETS.filter(
    (title) => !existingSheetTitles.has(title),
  );

  if (missingSheets.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: missingSheets.map((title) => ({
          addSheet: { properties: { title } },
        })),
      },
    });
  }

  return missingSheets;
};

const createGoogleSheetsErrorResponse = (
  error: unknown,
  context: {
    operation: string;
    resourceType?: string;
    resourceId?: string;
    path?: string;
  },
) => {
  const message = error instanceof Error ? error.message : String(error);

  if (message.toLowerCase().includes("does not have permission")) {
    return createErrorResponse(
      new Error(
        "Google Sheets access denied. Share the spreadsheet with GOOGLE_SHEETS_CLIENT_EMAIL as Editor.",
      ),
      context,
      403,
    );
  }

  if (
    message.toLowerCase().includes("requested entity was not found") ||
    message.toLowerCase().includes("not found")
  ) {
    return createErrorResponse(
      new Error(
        "Spreadsheet not found. Verify GOOGLE_SHEETS_SPREADSHEET_ID and ensure the service account can access it.",
      ),
      context,
      404,
    );
  }

  return createErrorResponse(error, context);
};

const getAuthClient = async (writeAccess: boolean = false) => {
  const projectId = getRequiredEnv("GOOGLE_SHEETS_PROJECT_ID");
  const privateKey = getRequiredEnv("GOOGLE_SHEETS_PRIVATE_KEY").replace(
    /\\n/g,
    "\n",
  );
  const clientEmail = getRequiredEnv("GOOGLE_SHEETS_CLIENT_EMAIL");
  const privateKeyId = process.env.GOOGLE_SHEETS_PRIVATE_KEY_ID?.trim();

  const credentials: {
    type: "service_account";
    project_id: string;
    private_key: string;
    client_email: string;
    private_key_id?: string;
  } = {
    type: "service_account",
    project_id: projectId,
    private_key: privateKey,
    client_email: clientEmail,
  };

  if (privateKeyId) {
    credentials.private_key_id = privateKeyId;
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: writeAccess
      ? ["https://www.googleapis.com/auth/spreadsheets"]
      : ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  return auth.getClient();
};

export async function GET() {
  try {
    const spreadsheetId = getSpreadsheetId();
    const client = await getAuthClient(false);
    const sheets = google.sheets({ version: "v4", auth: client as any });
    const createdSheets = await ensureRequiredSheets(sheets, spreadsheetId);

    const evaluatorResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'List of Evaluators'!A1:Z1000",
    });

    const establishmentResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'List of Eating Establishments'!A1:Z1000",
    });

    const budgetResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'Budget'!A1:Z1000",
    });

    // Combine data from all sheets
    evaluatorResponse.data.values = [
      ...(evaluatorResponse.data.values || []),
      ...(establishmentResponse.data.values || []),
      ...(budgetResponse.data.values || []),
    ];

    return NextResponse.json({
      status: "success",
      data: evaluatorResponse.data.values,
      ...(createdSheets.length > 0 ? { createdSheets } : {}),
    });
  } catch (error: unknown) {
    return createGoogleSheetsErrorResponse(error, {
      operation: "GET /api/sheets (Fetch Spreadsheet Data)",
      resourceType: "Google Sheets",
      path: "/api/sheets",
    });
  }
}

// Helper to safely convert value to string
const safeString = (value: any): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if (Array.isArray(value)) return value.join(", ");
    return JSON.stringify(value);
  }
  return String(value);
};

// Transform evaluators data to spreadsheet format
const transformEvaluatorsToSheet = (
  evaluators: any[],
  assignments: any[],
): string[][] => {
  // Header row
  const headers = [
    "No",
    "NAME",
    "EMAIL",
    "PHONE NUMBER",
    "CURRENT POSITION",
    "COMPANY/ORGANIZATION",
    "JEVA ID",
    "SPECIALTY",
    "NDA STATUS",
    "RESTAURANT COMPLETED",
    "NOT COMPLETED",
    "PROGRESS",
  ];

  const rows = evaluators.map((evaluator, index) => {
    // Calculate restaurant stats
    const evaluatorAssignments = assignments.filter(
      (a) => a.evaluator1Id === evaluator.id || a.evaluator2Id === evaluator.id,
    );
    const totalRestaurants = evaluatorAssignments.length;
    const completedRestaurants = evaluatorAssignments.filter((a) => {
      if (a.evaluator1Id === evaluator.id)
        return a.evaluator1Status === "completed";
      if (a.evaluator2Id === evaluator.id)
        return a.evaluator2Status === "completed";
      return false;
    }).length;
    const notCompleted = totalRestaurants - completedRestaurants;
    const progress =
      totalRestaurants > 0
        ? `${Math.round((completedRestaurants / totalRestaurants) * 100)}%`
        : "0%";

    // Determine NDA status
    let ndaStatus = "Not Sent";
    if (evaluator.nda?.status) {
      const status = evaluator.nda.status.toLowerCase();
      if (status === "signed" || status === "completed") ndaStatus = "Signed";
      else if (["sent", "delivered", "pending"].includes(status))
        ndaStatus = "Pending";
    }

    // Handle specialties
    let specialty = "";
    if (Array.isArray(evaluator.specialties)) {
      specialty = evaluator.specialties.join(", ");
    } else if (typeof evaluator.specialties === "string") {
      specialty = evaluator.specialties;
    } else if (
      typeof evaluator.specialties === "object" &&
      evaluator.specialties
    ) {
      specialty = Object.values(evaluator.specialties).join(", ");
    }

    return [
      String(index + 1),
      safeString(evaluator.name),
      safeString(evaluator.email),
      safeString(evaluator.phone),
      safeString(evaluator.position),
      safeString(evaluator.company),
      safeString(evaluator.id),
      specialty,
      ndaStatus,
      String(completedRestaurants),
      String(notCompleted),
      progress,
    ];
  });

  return [headers, ...rows];
};

// Transform establishments data to spreadsheet format
const transformEstablishmentsToSheet = (
  establishments: any[],
  assignments: any[],
  evaluators: any[],
): string[][] => {
  // Header row
  const headers = [
    "Name of Eating Establishments",
    "[Trimmed] Name of Eating Establishments",
    "Address",
    "Status",
    "Category",
    "Contact",
    "Rating (⭐)",
    "Budget (MYR)",
    "Halal Status",
    "Remarks",
    "Source",
    "BAKING/PASTRY",
    "EVALUATOR 1 ID 1",
    "EVALUATOR 2 ID 2",
    "MATCHED",
    "DATE ASSIGNED",
    "LAST UPDATED EVA 1",
    "COMPLETED EVA 1",
    "REMINDER NUMBER EVA 2",
    "LAST UPDATED EVA 2",
    "COMPLETED EVA 2",
    "ALL COMPLETED",
  ];

  const rows = establishments.map((establishment) => {
    const assignment = assignments.find(
      (a) => a.establishmentId === establishment.id,
    );

    const evaluator1 = assignment?.evaluator1Id
      ? evaluators.find((e) => e.id === assignment.evaluator1Id)
      : null;
    const evaluator2 = assignment?.evaluator2Id
      ? evaluators.find((e) => e.id === assignment.evaluator2Id)
      : null;

    const matched = assignment
      ? evaluator1 && evaluator2
        ? "Yes"
        : "Partial"
      : "No";
    const dateAssigned = assignment?.assignedAt
      ? new Date(assignment.assignedAt).toLocaleDateString()
      : "";

    const eva1Completed = assignment?.evaluator1Status === "completed";
    const eva2Completed = assignment?.evaluator2Status === "completed";
    const allCompleted = eva1Completed && eva2Completed ? "Yes" : "No";

    // Determine specialty match (BAKING/PASTRY column)
    const specialtyMatch =
      establishment.category?.toUpperCase().includes("BAKING") ||
      establishment.category?.toUpperCase().includes("PASTRY")
        ? "Yes"
        : "";

    return [
      safeString(establishment.name),
      safeString(establishment.name?.trim()),
      safeString(establishment.address),
      safeString(establishment.status || "Active"),
      safeString(establishment.category),
      safeString(establishment.contactInfo),
      safeString(establishment.rating),
      safeString(establishment.budget),
      safeString(establishment.halalStatus),
      safeString(establishment.remarks),
      safeString(establishment.source || ""),
      specialtyMatch,
      safeString(evaluator1?.id || ""),
      safeString(evaluator2?.id || ""),
      matched,
      dateAssigned,
      assignment?.evaluator1UpdatedAt
        ? new Date(assignment.evaluator1UpdatedAt).toLocaleDateString()
        : "",
      eva1Completed ? "Yes" : "No",
      safeString(assignment?.evaluator2ReminderCount || "0"),
      assignment?.evaluator2UpdatedAt
        ? new Date(assignment.evaluator2UpdatedAt).toLocaleDateString()
        : "",
      eva2Completed ? "Yes" : "No",
      allCompleted,
    ];
  });

  return [headers, ...rows];
};

// Transform budget data to spreadsheet format
const transformBudgetToSheet = (
  assignments: any[],
  evaluators: any[],
  establishments: any[],
): string[][] => {
  // Header row
  const headers = [
    "JEVA ID",
    "Assign ID",
    "Evaluator Name",
    "Email",
    "Company/Organization",
    "Restaurant Name",
    "Date Assigned",
    "Currency",
    "Amount Spent",
    "Budget",
    "Reimbursement",
  ];

  const rows: string[][] = [];

  assignments.forEach((assignment) => {
    const establishment = establishments.find(
      (e) => e.id === assignment.establishmentId,
    );

    // Add row for Evaluator 1 if exists
    if (assignment.evaluator1Id) {
      const evaluator = evaluators.find(
        (e) => e.id === assignment.evaluator1Id,
      );
      const amountSpent = assignment.evaluator1AmountSpent || 0;
      const currency =
        assignment.evaluator1Currency || establishment?.currency || "MYR";
      const budget = establishment?.budget || 0;
      const reimbursement = Math.min(Number(amountSpent), Number(budget));

      rows.push([
        safeString(evaluator?.id || assignment.evaluator1Id),
        safeString(assignment.id),
        safeString(evaluator?.name || ""),
        safeString(evaluator?.email || ""),
        safeString(evaluator?.company || ""),
        safeString(establishment?.name || ""),
        assignment.assignedAt
          ? new Date(assignment.assignedAt).toLocaleDateString()
          : "",
        safeString(currency),
        safeString(amountSpent),
        safeString(budget),
        safeString(reimbursement),
      ]);
    }

    // Add row for Evaluator 2 if exists
    if (assignment.evaluator2Id) {
      const evaluator = evaluators.find(
        (e) => e.id === assignment.evaluator2Id,
      );
      const amountSpent = assignment.evaluator2AmountSpent || 0;
      const currency =
        assignment.evaluator2Currency || establishment?.currency || "MYR";
      const budget = establishment?.budget || 0;
      const reimbursement = Math.min(Number(amountSpent), Number(budget));

      rows.push([
        safeString(evaluator?.id || assignment.evaluator2Id),
        safeString(assignment.id),
        safeString(evaluator?.name || ""),
        safeString(evaluator?.email || ""),
        safeString(evaluator?.company || ""),
        safeString(establishment?.name || ""),
        assignment.assignedAt
          ? new Date(assignment.assignedAt).toLocaleDateString()
          : "",
        safeString(currency),
        safeString(amountSpent),
        safeString(budget),
        safeString(reimbursement),
      ]);
    }
  });

  return [headers, ...rows];
};

export async function POST(request: NextRequest) {
  try {
    const spreadsheetId = getSpreadsheetId();
    const body = await request.json();
    const { evaluators, establishments, assignments } = body;

    if (!evaluators || !establishments || !assignments) {
      const missing = [];
      if (!evaluators) missing.push("evaluators");
      if (!establishments) missing.push("establishments");
      if (!assignments) missing.push("assignments");
      return createValidationError(
        missing[0],
        `Missing required data: ${missing.join(", ")}. All three arrays are required for sync`,
        "/api/sheets",
      );
    }

    const client = await getAuthClient(true);
    const sheets = google.sheets({ version: "v4", auth: client as any });
  const createdSheets = await ensureRequiredSheets(sheets, spreadsheetId);

    // Transform data for each sheet
    const evaluatorData = transformEvaluatorsToSheet(evaluators, assignments);
    const establishmentData = transformEstablishmentsToSheet(
      establishments,
      assignments,
      evaluators,
    );
    const budgetData = transformBudgetToSheet(
      assignments,
      evaluators,
      establishments,
    );

    // Clear and update Evaluators sheet
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: "'List of Evaluators'!A1:Z1000",
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "'List of Evaluators'!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: evaluatorData },
    });

    // Clear and update Establishments sheet
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: "'List of Eating Establishments'!A1:Z1000",
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "'List of Eating Establishments'!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: establishmentData },
    });

    // Clear and update Budget sheet
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: "'Budget'!A1:Z1000",
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "'Budget'!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: budgetData },
    });

    return NextResponse.json({
      status: "success",
      message: "Data synced to spreadsheet successfully",
      syncedAt: new Date().toISOString(),
      counts: {
        evaluators: evaluatorData.length - 1,
        establishments: establishmentData.length - 1,
        budgetEntries: budgetData.length - 1,
      },
      ...(createdSheets.length > 0 ? { createdSheets } : {}),
    });
  } catch (error: unknown) {
    return createGoogleSheetsErrorResponse(error, {
      operation: "POST /api/sheets (Sync to Spreadsheet)",
      resourceType: "Google Sheets",
      path: "/api/sheets",
    });
  }
}
