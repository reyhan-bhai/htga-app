import { db } from "@/lib/firebase-admin";
import crypto from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";

export const runtime = "nodejs";

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

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const assignmentId = formData.get("assignmentId");
    const evaluatorId = formData.get("evaluatorId");
    const receiptFile = formData.get("receipt");

    if (
      typeof assignmentId !== "string" ||
      typeof evaluatorId !== "string" ||
      !(receiptFile instanceof File)
    ) {
      return NextResponse.json(
        { error: "Invalid request payload." },
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
    const filename = `admin-${evaluatorId}-${Date.now()}-${crypto.randomUUID()}${extension}`;
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

    const assignmentData = snapshot.val() as Record<string, any>;
    const updates: Record<string, string> = {};

    if (assignmentData.evaluator1Id === evaluatorId) {
      updates.evaluator1Receipt = receiptPath;
    }

    if (assignmentData.evaluator2Id === evaluatorId) {
      updates.evaluator2Receipt = receiptPath;
    }

    const evaluators = assignmentData.evaluators || {};
    const jevaFirst = evaluators.JEVA_FIRST;
    const jevaSecond = evaluators.JEVA_SECOND;

    if (jevaFirst?.evaluatorId === evaluatorId) {
      updates["evaluators/JEVA_FIRST/receiptUrl"] = receiptPath;
    }

    if (jevaSecond?.evaluatorId === evaluatorId) {
      updates["evaluators/JEVA_SECOND/receiptUrl"] = receiptPath;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Evaluator does not match this assignment." },
        { status: 400 },
      );
    }

    await assignmentRef.update(updates);

    return NextResponse.json({ success: true, receiptPath });
  } catch (error) {
    console.error("[AdminReceiptUpdate] Error:", error);
    return NextResponse.json(
      { error: "Failed to update receipt." },
      { status: 500 },
    );
  }
}
