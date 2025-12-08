import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { Establishment } from "@/types/restaurant";

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
        return NextResponse.json(
          { error: "Establishment not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ establishment: { id, ...establishment } });
    }

    // Get all establishments or filter by category
    const ref = db.ref("establishments");
    const snapshot = await ref.once("value");
    const establishmentsData = snapshot.val();

    let establishments: Establishment[] = establishmentsData
      ? Object.entries(establishmentsData).map(([id, data]: [string, any]) => ({
          id,
          ...data,
        }))
      : [];

    // Filter by category if provided
    if (category) {
      establishments = establishments.filter(
        (e) => e.category.toLowerCase() === category.toLowerCase()
      );
    }

    return NextResponse.json({
      establishments,
      count: establishments.length,
    });
  } catch (e: any) {
    console.error("❌ Error getting establishments:", e);
    console.error("Stack trace:", e.stack);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST - Create new establishment
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category, address } = body;

    // Validation
    if (!name || !category) {
      return NextResponse.json(
        { error: "Name and category are required" },
        { status: 400 }
      );
    }

    const establishmentRef = db.ref("establishments").push();
    const establishmentId = establishmentRef.key!;

    const newEstablishment: Omit<Establishment, "id"> = {
      name,
      category,
      address: address || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await establishmentRef.set(newEstablishment);

    return NextResponse.json(
      {
        message: "Establishment created successfully",
        establishment: { id: establishmentId, ...newEstablishment },
      },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("❌ Error creating establishment:", e);
    console.error("Stack trace:", e.stack);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT - Update establishment
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, category, address } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Establishment ID is required" },
        { status: 400 }
      );
    }

    // Check if establishment exists
    const snapshot = await db.ref(`establishments/${id}`).once("value");
    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: "Establishment not found" },
        { status: 404 }
      );
    }

    const updates: Partial<Establishment> = {
      updatedAt: new Date().toISOString(),
    };

    if (name) updates.name = name;
    if (category) updates.category = category;
    if (address !== undefined) updates.address = address;

    await db.ref(`establishments/${id}`).update(updates);

    const updatedSnapshot = await db.ref(`establishments/${id}`).once("value");

    return NextResponse.json({
      message: "Establishment updated successfully",
      establishment: { id, ...updatedSnapshot.val() },
    });
  } catch (e: any) {
    console.error("❌ Error updating establishment:", e);
    console.error("Stack trace:", e.stack);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE - Delete establishment
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Establishment ID is required" },
        { status: 400 }
      );
    }

    // Check if establishment exists
    const snapshot = await db.ref(`establishments/${id}`).once("value");
    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: "Establishment not found" },
        { status: 404 }
      );
    }

    // Check if establishment has assignments
    const assignmentsSnapshot = await db
      .ref("assignments")
      .orderByChild("establishmentId")
      .equalTo(id)
      .once("value");

    if (assignmentsSnapshot.exists()) {
      return NextResponse.json(
        {
          error:
            "Cannot delete establishment with existing assignments. Please delete assignments first.",
        },
        { status: 400 }
      );
    }

    await db.ref(`establishments/${id}`).remove();

    return NextResponse.json({
      message: "Establishment deleted successfully",
    });
  } catch (e: any) {
    console.error("❌ Error deleting establishment:", e);
    console.error("Stack trace:", e.stack);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
