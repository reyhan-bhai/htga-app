import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

// Sample data based on the image you provided
const sampleEvaluators = [
  {
    name: "Ahmad Bakri",
    specialties: ["Bakery", "Italy", "FastFood"],
  },
  {
    name: "Maria Rossi",
    specialties: ["Italy", "FastFood", "Bakery"],
  },
  {
    name: "John Burger",
    specialties: ["FastFood", "Bakery"],
  },
];

const sampleEstablishments = [
  // Bakery
  { name: "Bread Paradise", category: "Bakery" },
  { name: "Golden Croissant", category: "Bakery" },
  { name: "Sweet Pastry", category: "Bakery" },
  { name: "Cake Heaven", category: "Bakery" },
  { name: "Dough Delight", category: "Bakery" },
  // Italy
  { name: "Pasta Amore", category: "Italy" },
  { name: "Pizza Napoli", category: "Italy" },
  { name: "Trattoria Roma", category: "Italy" },
  { name: "Bella Italia", category: "Italy" },
  { name: "Venezia Kitchen", category: "Italy" },
  // FastFood
  { name: "Quick Burger", category: "FastFood" },
  { name: "Speedy Fries", category: "FastFood" },
  { name: "Fast Bite", category: "FastFood" },
  { name: "Rapid Food", category: "FastFood" },
  { name: "Express Meal", category: "FastFood" },
];

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clearExisting = searchParams.get("clear") === "true";

    // Clear existing data if requested
    if (clearExisting) {
      await Promise.all([
        db.ref("evaluators").remove(),
        db.ref("establishments").remove(),
        db.ref("assignments").remove(),
      ]);
      console.log("✅ Cleared existing data");
    }

    // Check if data already exists
    const [evaluatorsSnap, establishmentsSnap] = await Promise.all([
      db.ref("evaluators").once("value"),
      db.ref("establishments").once("value"),
    ]);

    if (
      evaluatorsSnap.exists() &&
      establishmentsSnap.exists() &&
      !clearExisting
    ) {
      return NextResponse.json(
        {
          message: "Data already exists. Use ?clear=true to clear and reseed.",
        },
        { status: 400 }
      );
    }

    // Seed evaluators
    const evaluatorIds: string[] = [];
    for (const evaluator of sampleEvaluators) {
      const ref = db.ref("evaluators").push();
      await ref.set({
        ...evaluator,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      evaluatorIds.push(ref.key!);
    }
    console.log(`✅ Seeded ${evaluatorIds.length} evaluators`);

    // Seed establishments
    const establishmentIds: string[] = [];
    for (const establishment of sampleEstablishments) {
      const ref = db.ref("establishments").push();
      await ref.set({
        ...establishment,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      establishmentIds.push(ref.key!);
    }
    console.log(`✅ Seeded ${establishmentIds.length} establishments`);

    return NextResponse.json(
      {
        message: "Database seeded successfully",
        stats: {
          evaluators: evaluatorIds.length,
          establishments: establishmentIds.length,
        },
        evaluatorIds,
        establishmentIds,
      },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("❌ Error seeding database:", e);
    console.error("Stack trace:", e.stack);
    return NextResponse.json(
      { error: e.message, stack: e.stack },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const [evaluatorsSnap, establishmentsSnap, assignmentsSnap] =
      await Promise.all([
        db.ref("evaluators").once("value"),
        db.ref("establishments").once("value"),
        db.ref("assignments").once("value"),
      ]);

    const stats = {
      evaluators: evaluatorsSnap.exists()
        ? Object.keys(evaluatorsSnap.val()).length
        : 0,
      establishments: establishmentsSnap.exists()
        ? Object.keys(establishmentsSnap.val()).length
        : 0,
      assignments: assignmentsSnap.exists()
        ? Object.keys(assignmentsSnap.val()).length
        : 0,
    };

    return NextResponse.json({
      message: "Database statistics",
      stats,
      isEmpty:
        stats.evaluators === 0 &&
        stats.establishments === 0 &&
        stats.assignments === 0,
    });
  } catch (e: any) {
    console.error("❌ Error getting stats:", e);
    console.error("Stack trace:", e.stack);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await Promise.all([
      db.ref("evaluators").remove(),
      db.ref("establishments").remove(),
      db.ref("assignments").remove(),
    ]);

    return NextResponse.json({
      message: "All data cleared successfully",
    });
  } catch (e: any) {
    console.error("❌ Error clearing database:", e);
    console.error("Stack trace:", e.stack);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
