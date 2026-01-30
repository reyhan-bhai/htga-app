// src/app/api/sheets/route.ts
import {
  createErrorResponse,
  createValidationError,
} from "@/lib/api-error-handler";
import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

const SPREADSHEET_ID = "1THH_mVOFUAorNjVtGm37KJyBpE-ttsN5Z2Xa75O5YD0";

const getAuthClient = async (writeAccess: boolean = false) => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      type: "service_account",
      project_id: "eirene-5413a",
      private_key_id: "074887058c91682c30e4859583937f4cdaf1a1c6",
      private_key:
        "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDQCmlHx/ffOR6m\nngLM0YimD10Fplvjr8I82ZNomucz31wUP9FRB8YXhcURmrDhAwygHgIRWKSC/K5B\n1Y8lVvJEqggymBwqpGfCEMHOsQo0sFA9wr/VQgv/zoDdQKTTUaSlgTsOmsIhsBiQ\nnSHG4Cc2iRNWiiJkt8xQ71zkdyWKuvS9w/3R8/PjvF8nytVhr/UKbtRaFMk47zuY\nzYKAx1+5C9cRD7DtFLrmaPaRfGFCvsWCiOUq7acqo0EjL1/zctnF+f6KtG6PaMbx\nPIYsosTFZy4bvTQrLdQr2j4MnsR/4tkKVSBIWUZ+4hHtKv9+VKeSrSk7LUD0n5s9\nDjKdzpCtAgMBAAECggEALc14/9+ADGKSQ7sqoSbpp6vevlFxzidiQ4zghimCiRpe\nNqwVPLqSK5gdOuK8mhGWjEMHEAQc1iTlBaQLy7wAg0sPGnqASwgeuux/Cu9R8Kc3\nx10y6HQN2cBAgVXL5CWHsxOIac77Ojj/s4kQyG0N3RUhT46Cg3uuzUvhvwAXYRsh\n2/6m8bKCTRHvIEKjzEnQgeYnPettWp8SDfHqc6BAZcaJLNioVSshPVG6MiJoUHOe\nOr61Dwg74gwTVEnVXE5SILwpPiiBjcbEVlz+4CKhz2Eq+5iqB7nqAcnBQVfuRCXd\nIAzUzHND+nlqxXZuA/OIZeZEi5TGPtbPZezxlJr5IQKBgQD1QysKN4NMY72oZk6v\nXmPW6hwSQKyBKgl3/86ZMpM/GX4ta5VJjgOegL0ccMGS6SzB618NzRvgiM6reM0V\nrFSR2x75u47nWRiVRohy5wmeZmgYhiFfQ2M+qiBojtRN2lFz1IGk4ASxlZjpXfew\nQZTyWKRoglUuge7SyA0JRnpGIQKBgQDZJhKbiGxsOvEmm+kqVHm5PUxR1Uzh5rrs\nCWBYZyZzvKE84QUfp8jX8G4vDdh3vjp3MXcjquwqK69PZRslJSAJ4VlxPGQGuvZ0\nog1z3QUt+3rdxWmyyfDZokB623QyvIrAHDzrLw6TeEp/gORfyeErEXRZDl/O/5lv\nL8f25zbhDQKBgQC76Dk6e6uhxC0Tr0aLv7KYfwcAyQIhd7aHdLqxzvjXeE2euPVI\nxIBrWNEK0CzOxM1gyVcrOMEp90b4QvZFq6GjmhESXquu/ikCfWafOfm5nVYVq/Y3\niWapJSjtUri/6QtMxjyJuISAFlBwQ2k4Zhaa0mUsGObwWeZDIbgzKgcWYQKBgCV0\nU7FQDqN8ZyvpqIYMnBI/aHKU//XW/lbIJz4YTKGZ35XImkGjhxj394lWMgg1X5A/\nj/Uu/h0n+80N+2ikxqntnKfTas1eYjQr33YkoUgVIFQwQNL90fU37zdBswEtVCFe\nvYMzUqhND0x+xuVexN/Q2uihehUSMTzkWPFVYDnhAoGAILziclsO7p3iGPSlmU3N\n7ljk24nZd07FBlkwm+sAt36uYdwEXQzQT3cPTpBcKkQEjoEXviTAmq7T45qvsCFi\na8Ei9POqsfBX2Y2v93HhP5owtf9BhAZP+kvN7EfEQZhE3lcn4U4M51kdnHW+sL0V\n3scQ5Ijl/rU/mY5aSxzAVms=\n-----END PRIVATE KEY-----\n",
      client_email: "htga-spreadsheet@eirene-5413a.iam.gserviceaccount.com",
    },
    scopes: writeAccess
      ? ["https://www.googleapis.com/auth/spreadsheets"]
      : ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  return auth.getClient();
};

export async function GET() {
  try {
    const client = await getAuthClient(false);
    const sheets = google.sheets({ version: "v4", auth: client as any });

    const evaluatorResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "'List of Evaluators'!A1:Z1000",
    });

    const establishmentResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "'List of Eating Establishments'!A1:Z1000",
    });

    const budgetResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
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
    });
  } catch (error: unknown) {
    return createErrorResponse(error, {
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
      spreadsheetId: SPREADSHEET_ID,
      range: "'List of Evaluators'!A1:Z1000",
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: "'List of Evaluators'!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: evaluatorData },
    });

    // Clear and update Establishments sheet
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: "'List of Eating Establishments'!A1:Z1000",
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: "'List of Eating Establishments'!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: establishmentData },
    });

    // Clear and update Budget sheet
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: "'Budget'!A1:Z1000",
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
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
    });
  } catch (error: unknown) {
    return createErrorResponse(error, {
      operation: "POST /api/sheets (Sync to Spreadsheet)",
      resourceType: "Google Sheets",
      path: "/api/sheets",
    });
  }
}
