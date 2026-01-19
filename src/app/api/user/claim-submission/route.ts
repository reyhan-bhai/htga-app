import { db } from "@/lib/firebase-admin";
import crypto from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";

export const runtime = "nodejs";

interface ClaimSubmissionPayload {
  assignmentId: string;
  evaluatorId: string;
  amountSpent: number;
  receiptPath: string;
}

const getFileExtension = (file: File): string => {
  const nameExtension = path.extname(file.name || "").toLowerCase();
  if (nameExtension) {
    return nameExtension;
  }

  switch (file.type) {
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/heic":
    case "image/heif":
      return ".heic";
    case "image/jpeg":
    default:
      return ".jpg";
  }
};

const buildAssignmentUpdates = (
  assignment: Record<string, any>,
  payload: ClaimSubmissionPayload,
): Record<string, string | number> => {
  const updates: Record<string, string | number> = {};

  if (assignment.evaluator1Id === payload.evaluatorId) {
    updates.evaluator1Receipt = payload.receiptPath;
    updates.evaluator1AmountSpent = payload.amountSpent;
    updates.evaluator1Status = "completed";
  }

  if (assignment.evaluator2Id === payload.evaluatorId) {
    updates.evaluator2Receipt = payload.receiptPath;
    updates.evaluator2AmountSpent = payload.amountSpent;
    updates.evaluator2Status = "completed";
  }

  const evaluators = assignment.evaluators || {};
  const jevaFirst = evaluators.JEVA_FIRST;
  const jevaSecond = evaluators.JEVA_SECOND;

  if (jevaFirst?.evaluatorId === payload.evaluatorId) {
    updates["evaluators/JEVA_FIRST/receiptUrl"] = payload.receiptPath;
    updates["evaluators/JEVA_FIRST/amountSpent"] = payload.amountSpent;
    updates["evaluators/JEVA_FIRST/status"] = "completed";
    updates["evaluators/JEVA_FIRST/evaluatorStatus"] = "completed";
  }

  if (jevaSecond?.evaluatorId === payload.evaluatorId) {
    updates["evaluators/JEVA_SECOND/receiptUrl"] = payload.receiptPath;
    updates["evaluators/JEVA_SECOND/amountSpent"] = payload.amountSpent;
    updates["evaluators/JEVA_SECOND/status"] = "completed";
    updates["evaluators/JEVA_SECOND/evaluatorStatus"] = "completed";
  }

  return updates;
};

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const assignmentId = formData.get("assignmentId");
    const evaluatorId = formData.get("evaluatorId");
    const amountSpentValue = formData.get("amountSpent");
    const receiptFile = formData.get("receipt");

    if (
      typeof assignmentId !== "string" ||
      typeof evaluatorId !== "string" ||
      typeof amountSpentValue !== "string" ||
      !(receiptFile instanceof File)
    ) {
      return NextResponse.json(
        { error: "Invalid request payload." },
        { status: 400 },
      );
    }

    const amountSpent = Number.parseFloat(amountSpentValue);
    if (Number.isNaN(amountSpent) || amountSpent <= 0) {
      return NextResponse.json(
        { error: "Amount spent must be a positive number." },
        { status: 400 },
      );
    }

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "claims",
      assignmentId,
    );
    await mkdir(uploadDir, { recursive: true });

    const extension = getFileExtension(receiptFile);
    const filename = `${evaluatorId}-${Date.now()}-${crypto.randomUUID()}${extension}`;
    const filePath = path.join(uploadDir, filename);
    const arrayBuffer = await receiptFile.arrayBuffer();

    await writeFile(filePath, Buffer.from(arrayBuffer));

    const receiptPath = `/uploads/claims/${assignmentId}/${filename}`;

    const assignmentRef = db.ref(`assignments/${assignmentId}`);
    const snapshot = await assignmentRef.get();

    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: "Assignment not found." },
        { status: 404 },
      );
    }

    const assignmentData = snapshot.val();
    const updates = buildAssignmentUpdates(assignmentData, {
      assignmentId,
      evaluatorId,
      amountSpent,
      receiptPath,
    });

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Evaluator does not match this assignment." },
        { status: 400 },
      );
    }

    await assignmentRef.update(updates);

    return NextResponse.json({
      success: true,
      receiptPath,
      amountSpent,
    });
  } catch (error) {
    console.error("[ClaimSubmission] Error:", error);
    return NextResponse.json(
      { error: "Failed to submit claim." },
      { status: 500 },
    );
  }
}
