// src/app/api/admin/handbook/route.ts
import {
  createErrorResponse,
  createValidationError,
} from "@/lib/api-error-handler";
import { db } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

interface HandbookDocument {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  uploadedAt: string;
  updatedAt?: string;
  isActive: boolean;
  order: number;
}

// GET - Fetch all handbook documents
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const activeOnly = searchParams.get("activeOnly") === "true";

    const handbooksRef = db.ref("handbooks");

    if (id) {
      // Get specific document
      const snapshot = await handbooksRef.child(id).get();
      if (!snapshot.exists()) {
        return NextResponse.json(
          {
            status: "error",
            error: "Handbook document not found",
            code: "NOT_FOUND",
          },
          { status: 404 },
        );
      }
      return NextResponse.json({
        status: "success",
        data: { id: snapshot.key, ...snapshot.val() },
      });
    }

    // Get all documents
    const snapshot = await handbooksRef.get();

    if (!snapshot.exists()) {
      return NextResponse.json({
        status: "success",
        data: [],
        message: "No handbook documents found",
      });
    }

    const documents: HandbookDocument[] = [];
    snapshot.forEach((child) => {
      const doc = { id: child.key!, ...child.val() };
      console.log("Found document:", doc);
      if (activeOnly) {
        if (doc.isActive) documents.push(doc);
      } else {
        documents.push(doc);
      }
    });

    // Sort by order client-side instead of using Firebase index
    documents.sort((a, b) => (a.order || 0) - (b.order || 0));

    console.log("Total documents to return:", documents.length);
    return NextResponse.json({
      status: "success",
      data: documents,
      count: documents.length,
    });
  } catch (error) {
    return createErrorResponse(error, {
      operation: "GET /api/admin/handbook",
      resourceType: "Handbook",
      path: "/api/admin/handbook",
    });
  }
}

// POST - Create new handbook document
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, fileUrl } = body;

    // Validation
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return createValidationError(
        "title",
        "Title is required",
        "/api/admin/handbook",
      );
    }

    if (!fileUrl || typeof fileUrl !== "string") {
      return createValidationError(
        "fileUrl",
        "File URL/Link is required",
        "/api/admin/handbook",
      );
    }

    // Get current count for ordering
    const handbooksRef = db.ref("handbooks");
    const countSnapshot = await handbooksRef.get();
    const currentCount = countSnapshot.exists()
      ? Object.keys(countSnapshot.val()).length
      : 0;

    // Generate ID
    const newDocRef = handbooksRef.push();
    const docId = newDocRef.key;

    const newDocument: Omit<HandbookDocument, "id"> = {
      title: title.trim(),
      description: description?.trim() || "",
      fileUrl: fileUrl.trim(),
      uploadedAt: new Date().toISOString(),
      isActive: true,
      order: currentCount + 1,
    };

    await newDocRef.set(newDocument);

    return NextResponse.json(
      {
        status: "success",
        message: "Handbook document created successfully",
        data: { id: docId, ...newDocument },
      },
      { status: 201 },
    );
  } catch (error) {
    return createErrorResponse(error, {
      operation: "POST /api/admin/handbook",
      resourceType: "Handbook",
      path: "/api/admin/handbook",
    });
  }
}

// PUT - Update handbook document
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, description, fileUrl, isActive, order } = body;

    if (!id) {
      return createValidationError(
        "id",
        "Document ID is required for update",
        "/api/admin/handbook",
      );
    }

    const docRef = db.ref(`handbooks/${id}`);
    const snapshot = await docRef.get();

    if (!snapshot.exists()) {
      return NextResponse.json(
        {
          status: "error",
          error: "Handbook document not found",
          code: "NOT_FOUND",
        },
        { status: 404 },
      );
    }

    const existingData = snapshot.val();
    const updateData: Partial<HandbookDocument> = {
      ...existingData,
      updatedAt: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (fileUrl !== undefined) updateData.fileUrl = fileUrl.trim();
    if (isActive !== undefined) updateData.isActive = isActive;
    if (order !== undefined) updateData.order = order;

    await docRef.update(updateData);

    return NextResponse.json({
      status: "success",
      message: "Handbook document updated successfully",
      data: { id, ...updateData },
    });
  } catch (error) {
    return createErrorResponse(error, {
      operation: "PUT /api/admin/handbook",
      resourceType: "Handbook",
      path: "/api/admin/handbook",
    });
  }
}

// DELETE - Delete handbook document
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return createValidationError(
        "id",
        "Document ID is required for deletion",
        "/api/admin/handbook",
      );
    }

    const docRef = db.ref(`handbooks/${id}`);
    const snapshot = await docRef.get();

    if (!snapshot.exists()) {
      return NextResponse.json(
        {
          status: "error",
          error: "Handbook document not found",
          code: "NOT_FOUND",
        },
        { status: 404 },
      );
    }

    await docRef.remove();

    return NextResponse.json({
      status: "success",
      message: "Handbook document deleted successfully",
      deletedId: id,
    });
  } catch (error) {
    return createErrorResponse(error, {
      operation: "DELETE /api/admin/handbook",
      resourceType: "Handbook",
      path: "/api/admin/handbook",
    });
  }
}
