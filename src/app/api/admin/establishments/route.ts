import {
  createConflictError,
  createErrorResponse,
  createNotFoundError,
  createValidationError,
} from "@/lib/api-error-handler";
import { db } from "@/lib/firebase-admin";
import { Establishment } from "@/types/restaurant";
import { NextResponse } from "next/server";

// GET - Get all establishments or specific establishment by ID
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const category = searchParams.get("category");

    if (id) {
      // Get specific establishment
      const snapshot = await db.ref(`establishments/${id}`).once("value");
      const establishment = snapshot.val();

      if (!establishment) {
        return createNotFoundError(
          "Establishment",
          id,
          "/api/admin/establishments",
        );
      }

      return NextResponse.json({ establishment: { id, ...establishment } });
    }

    // Get all establishments or filter by category
    const ref = db.ref("establishments");
    const snapshot = await ref.once("value");
    const establishmentsData = snapshot.val();

    let establishments: Establishment[] = establishmentsData
      ? Object.entries(establishmentsData)
          .filter(
            ([id, data]: [string, any]) => id !== "dropdown" && data?.name,
          )
          .map(([id, data]: [string, any]) => ({
            id,
            ...data,
          }))
      : [];

    // Filter by category if provided
    if (category) {
      establishments = establishments.filter(
        (e) => e.category.toLowerCase() === category.toLowerCase(),
      );
    }

    return NextResponse.json({
      establishments,
      count: establishments.length,
    });
  } catch (error: unknown) {
    return createErrorResponse(error, {
      operation: "GET /api/admin/establishments",
      resourceType: "Establishment",
      path: "/api/admin/establishments",
    });
  }
}

// POST - Create new establishment
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      category,
      address,
      contactInfo,
      rating,
      budget,
      currency,
      halalStatus,
      remarks,
    } = body;

    // Validation
    if (!name || !category) {
      return createValidationError(
        !name ? "name" : "category",
        "Name and category are required to create an establishment",
        "/api/admin/establishments",
      );
    }

    const establishmentRef = db.ref("establishments").push();
    const establishmentId = establishmentRef.key!;

    const newEstablishment: any = {
      name,
      category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (address) newEstablishment.address = address;
    if (contactInfo) newEstablishment.contactInfo = contactInfo;
    if (rating) newEstablishment.rating = rating;
    if (budget) newEstablishment.budget = budget;
    if (currency) newEstablishment.currency = currency;
    if (halalStatus) newEstablishment.halalStatus = halalStatus;
    if (remarks) newEstablishment.remarks = remarks;

    await establishmentRef.set(newEstablishment);

    return NextResponse.json(
      {
        message: "Establishment created successfully",
        establishment: { id: establishmentId, ...newEstablishment },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    return createErrorResponse(error, {
      operation: "POST /api/admin/establishments (Create Establishment)",
      resourceType: "Establishment",
      path: "/api/admin/establishments",
    });
  }
}

// PUT - Update establishment
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      category,
      address,
      contactInfo,
      rating,
      budget,
      currency,
      halalStatus,
      remarks,
    } = body;

    if (!id) {
      return createValidationError(
        "id",
        "Establishment ID is required for update operation",
        "/api/admin/establishments",
      );
    }

    // Check if establishment exists
    const snapshot = await db.ref(`establishments/${id}`).once("value");
    if (!snapshot.exists()) {
      return createNotFoundError(
        "Establishment",
        id,
        "/api/admin/establishments",
      );
    }

    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (name) updates.name = name;
    if (category) updates.category = category;
    if (address) updates.address = address;
    if (contactInfo) updates.contactInfo = contactInfo;
    if (rating) updates.rating = rating;
    if (budget) updates.budget = budget;
    if (currency) updates.currency = currency;
    if (halalStatus) updates.halalStatus = halalStatus;
    if (remarks) updates.remarks = remarks;

    await db.ref(`establishments/${id}`).update(updates);

    const updatedSnapshot = await db.ref(`establishments/${id}`).once("value");

    return NextResponse.json({
      message: "Establishment updated successfully",
      establishment: { id, ...updatedSnapshot.val() },
    });
  } catch (error: unknown) {
    return createErrorResponse(error, {
      operation: "PUT /api/admin/establishments (Update Establishment)",
      resourceType: "Establishment",
      path: "/api/admin/establishments",
    });
  }
}

// DELETE - Delete establishment
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return createValidationError(
        "id",
        "Establishment ID is required for delete operation",
        "/api/admin/establishments",
      );
    }

    // Check if establishment exists
    const snapshot = await db.ref(`establishments/${id}`).once("value");
    if (!snapshot.exists()) {
      return createNotFoundError(
        "Establishment",
        id,
        "/api/admin/establishments",
      );
    }

    // Check if establishment has assignments
    const assignmentsSnapshot = await db
      .ref("assignments")
      .orderByChild("establishmentId")
      .equalTo(id)
      .once("value");

    if (assignmentsSnapshot.exists()) {
      return createConflictError(
        `Cannot delete establishment '${id}' with existing assignments`,
        "Please delete or reassign the establishment's assignments first before deleting the establishment",
        "/api/admin/establishments",
      );
    }

    await db.ref(`establishments/${id}`).remove();

    return NextResponse.json({
      message: "Establishment deleted successfully",
    });
  } catch (error: unknown) {
    return createErrorResponse(error, {
      operation: "DELETE /api/admin/establishments",
      resourceType: "Establishment",
      path: "/api/admin/establishments",
    });
  }
}
