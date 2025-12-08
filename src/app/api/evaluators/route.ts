import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { Evaluator } from "@/types/restaurant";

// GET - Get all evaluators or specific evaluator by ID
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      // Get specific evaluator
      const snapshot = await db.ref(`evaluators/${id}`).once("value");
      const evaluator = snapshot.val();

      if (!evaluator) {
        return NextResponse.json(
          { error: "Evaluator not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ evaluator: { id, ...evaluator } });
    }

    // Get all evaluators
    const snapshot = await db.ref("evaluators").once("value");
    const evaluatorsData = snapshot.val();

    const evaluators: Evaluator[] = evaluatorsData
      ? Object.entries(evaluatorsData).map(([id, data]: [string, any]) => ({
          id,
          ...data,
        }))
      : [];

    return NextResponse.json({
      evaluators,
      count: evaluators.length,
    });
  } catch (e: any) {
    console.error("❌ Error getting evaluators:", e);
    console.error("Stack trace:", e.stack);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST - Create new evaluator
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, specialties, maxAssignments } = body;

    // Validation
    if (!name || !specialties || !Array.isArray(specialties)) {
      return NextResponse.json(
        { error: "Name and specialties (array) are required" },
        { status: 400 }
      );
    }

    const evaluatorRef = db.ref("evaluators").push();
    const evaluatorId = evaluatorRef.key!;

    const newEvaluator: Omit<Evaluator, "id"> = {
      name,
      specialties,
      maxAssignments: maxAssignments || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await evaluatorRef.set(newEvaluator);

    return NextResponse.json(
      {
        message: "Evaluator created successfully",
        evaluator: { id: evaluatorId, ...newEvaluator },
      },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("❌ Error creating evaluator:", e);
    console.error("Stack trace:", e.stack);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT - Update evaluator
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, specialties, maxAssignments } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Evaluator ID is required" },
        { status: 400 }
      );
    }

    // Check if evaluator exists
    const snapshot = await db.ref(`evaluators/${id}`).once("value");
    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: "Evaluator not found" },
        { status: 404 }
      );
    }

    const updates: Partial<Evaluator> = {
      updatedAt: new Date().toISOString(),
    };

    if (name) updates.name = name;
    if (specialties) updates.specialties = specialties;
    if (maxAssignments !== undefined) updates.maxAssignments = maxAssignments;

    await db.ref(`evaluators/${id}`).update(updates);

    const updatedSnapshot = await db.ref(`evaluators/${id}`).once("value");

    return NextResponse.json({
      message: "Evaluator updated successfully",
      evaluator: { id, ...updatedSnapshot.val() },
    });
  } catch (e: any) {
    console.error("❌ Error updating evaluator:", e);
    console.error("Stack trace:", e.stack);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE - Delete evaluator
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Evaluator ID is required" },
        { status: 400 }
      );
    }

    // Check if evaluator exists
    const snapshot = await db.ref(`evaluators/${id}`).once("value");
    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: "Evaluator not found" },
        { status: 404 }
      );
    }

    // Check if evaluator has assignments
    const assignmentsSnapshot = await db
      .ref("assignments")
      .orderByChild("evaluator1Id")
      .equalTo(id)
      .once("value");

    const assignmentsSnapshot2 = await db
      .ref("assignments")
      .orderByChild("evaluator2Id")
      .equalTo(id)
      .once("value");

    if (assignmentsSnapshot.exists() || assignmentsSnapshot2.exists()) {
      return NextResponse.json(
        {
          error:
            "Cannot delete evaluator with existing assignments. Please reassign or delete assignments first.",
        },
        { status: 400 }
      );
    }

    await db.ref(`evaluators/${id}`).remove();

    return NextResponse.json({
      message: "Evaluator deleted successfully",
    });
  } catch (e: any) {
    console.error("❌ Error deleting evaluator:", e);
    console.error("Stack trace:", e.stack);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
