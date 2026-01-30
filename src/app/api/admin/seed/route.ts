import { createErrorResponse } from "@/lib/api-error-handler";
import { db } from "@/lib/firebase-admin";
import crypto from "crypto";
import { NextResponse } from "next/server";

// Helper function to generate next evaluator ID
async function generateEvaluatorId(): Promise<string> {
  const snapshot = await db.ref("evaluators").once("value");
  const evaluatorsData = snapshot.val();

  if (!evaluatorsData) {
    return "JEVA01";
  }

  // Extract all IDs and find the highest number
  const ids = Object.keys(evaluatorsData);
  const numbers = ids
    .filter((id) => id.startsWith("JEVA"))
    .map((id) => parseInt(id.substring(4)))
    .filter((num) => !isNaN(num));

  const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
  const nextNumber = maxNumber + 1;

  return `JEVA${nextNumber.toString().padStart(2, "0")}`;
}

// Sample data based on the image you provided
const sampleEvaluators = [
  {
    name: "Ahmad Bakri",
    email: "ahmad.bakri@example.com",
    phone: "+60123456789",
    position: "Senior Evaluator",
    company: "HTGA Corp",
    specialties: "Bakery",
    maxAssignments: 5,
  },
  {
    name: "Maria Rossi",
    email: "maria.rossi@example.com",
    phone: "+60123456790",
    position: "Food Critic",
    company: "Culinary Reviews",
    specialties: "Italy",
    maxAssignments: 4,
  },
  {
    name: "John Burger",
    email: "john.burger@example.com",
    phone: "+60123456791",
    position: "Restaurant Inspector",
    company: "Food Safety Inc",
    specialties: "FastFood",
    maxAssignments: 6,
  },
  {
    name: "Sarah Chen",
    email: "sarah.chen@example.com",
    phone: "+60123456792",
    position: "Quality Assurance",
    company: "Dining Standards",
    specialties: "Bakery",
    maxAssignments: 5,
  },
  {
    name: "David Kumar",
    email: "david.kumar@example.com",
    phone: "+60123456793",
    position: "Field Evaluator",
    company: "Restaurant Reviews Co",
    specialties: "FastFood",
    maxAssignments: 7,
  },
  {
    name: "Lisa Wong",
    email: "lisa.wong@example.com",
    phone: "+60123456794",
    position: "Senior Analyst",
    company: "Food Quality Labs",
    specialties: "Bakery",
    maxAssignments: 4,
  },
  {
    name: "Michael Tan",
    email: "michael.tan@example.com",
    phone: "+60123456795",
    position: "Operations Manager",
    company: "Culinary Excellence",
    specialties: "Italy",
    maxAssignments: 6,
  },
  {
    name: "Anna Schmidt",
    email: "anna.schmidt@example.com",
    phone: "+60123456796",
    position: "International Evaluator",
    company: "Global Food Standards",
    specialties: "Italy",
    maxAssignments: 5,
  },
  {
    name: "Raj Patel",
    email: "raj.patel@example.com",
    phone: "+60123456797",
    position: "Compliance Officer",
    company: "Food Safety Authority",
    specialties: "FastFood",
    maxAssignments: 8,
  },
  {
    name: "Emily Davis",
    email: "emily.davis@example.com",
    phone: "+60123456798",
    position: "Research Analyst",
    company: "Dining Research Institute",
    specialties: "Italy",
    maxAssignments: 5,
  },
];

const sampleEstablishments = [
  // Bakery
  {
    name: "Bread Paradise",
    category: "Bakery",
    address: "123 Bakery Street, Johor Bahru",
    contactInfo: "+60123456792",
    rating: 4.5,
    budget: "30",
    halalStatus: "Muslim-Owned",
    remarks: "Excellent bread selection",
  },
  {
    name: "Golden Croissant",
    category: "Bakery",
    address: "456 Pastry Lane, Johor Bahru",
    contactInfo: "+60123456793",
    rating: 4.2,
    budget: "25",
    halalStatus: "Muslim-friendly",
    remarks: "Best croissants in town",
  },
  {
    name: "Sweet Pastry",
    category: "Bakery",
    address: "789 Dessert Road, Johor Bahru",
    contactInfo: "+60123456794",
    rating: 4.7,
    budget: "35",
    halalStatus: "Muslim-Owned",
    remarks: "Specializes in traditional Malay pastries",
  },
  {
    name: "Cake Heaven",
    category: "Bakery",
    address: "321 Cake Avenue, Johor Bahru",
    contactInfo: "+60123456795",
    rating: 4.3,
    budget: "40",
    halalStatus: "Muslim-friendly",
    remarks: "Wedding cake specialists",
  },
  {
    name: "Dough Delight",
    category: "Bakery",
    address: "654 Bread Boulevard, Johor Bahru",
    contactInfo: "+60123456796",
    rating: 4.1,
    budget: "20",
    halalStatus: "Muslim-Owned",
    remarks: "Affordable and delicious",
  },
  // Italy
  {
    name: "Pasta Amore",
    category: "Italy",
    address: "111 Italian Street, Johor Bahru",
    contactInfo: "+60123456797",
    rating: 4.6,
    budget: "45",
    halalStatus: "Muslim-friendly",
    remarks: "Authentic Italian cuisine",
  },
  {
    name: "Pizza Napoli",
    category: "Italy",
    address: "222 Pizza Plaza, Johor Bahru",
    contactInfo: "+60123456798",
    rating: 4.4,
    budget: "35",
    halalStatus: "Muslim-friendly",
    remarks: "Wood-fired pizza oven",
  },
  {
    name: "Trattoria Roma",
    category: "Italy",
    address: "333 Roman Road, Johor Bahru",
    contactInfo: "+60123456799",
    rating: 4.8,
    budget: "55",
    halalStatus: "Muslim-friendly",
    remarks: "Fine dining Italian restaurant",
  },
  {
    name: "Bella Italia",
    category: "Italy",
    address: "444 Italian Avenue, Johor Bahru",
    contactInfo: "+60123456800",
    rating: 4.2,
    budget: "40",
    halalStatus: "Muslim-friendly",
    remarks: "Family-friendly Italian dining",
  },
  {
    name: "Venezia Kitchen",
    category: "Italy",
    address: "555 Venetian Lane, Johor Bahru",
    contactInfo: "+60123456801",
    rating: 4.5,
    budget: "50",
    halalStatus: "Muslim-friendly",
    remarks: "Venetian specialties",
  },
  // FastFood
  {
    name: "Quick Burger",
    category: "FastFood",
    address: "666 Burger Boulevard, Johor Bahru",
    contactInfo: "+60123456802",
    rating: 4.0,
    budget: "15",
    halalStatus: "Muslim-Owned",
    remarks: "Fast and affordable burgers",
  },
  {
    name: "Speedy Fries",
    category: "FastFood",
    address: "777 Fast Lane, Johor Bahru",
    contactInfo: "+60123456803",
    rating: 3.8,
    budget: "12",
    halalStatus: "Muslim-friendly",
    remarks: "Best fries in town",
  },
  {
    name: "Fast Bite",
    category: "FastFood",
    address: "888 Quick Street, Johor Bahru",
    contactInfo: "+60123456804",
    rating: 4.1,
    budget: "18",
    halalStatus: "Muslim-Owned",
    remarks: "Quick service, great taste",
  },
  {
    name: "Rapid Food",
    category: "FastFood",
    address: "999 Speed Road, Johor Bahru",
    contactInfo: "+60123456805",
    rating: 3.9,
    budget: "16",
    halalStatus: "Muslim-friendly",
    remarks: "Drive-thru available",
  },
  {
    name: "Express Meal",
    category: "FastFood",
    address: "000 Express Avenue, Johor Bahru",
    contactInfo: "+60123456806",
    rating: 4.2,
    budget: "20",
    halalStatus: "Muslim-Owned",
    remarks: "Healthy fast food options",
  },
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
        { status: 400 },
      );
    }

    // Seed evaluators
    const evaluatorIds: string[] = [];
    for (const evaluator of sampleEvaluators) {
      // Generate custom ID (JEVA01, JEVA02, etc.)
      const evaluatorId = await generateEvaluatorId();

      // Generate a random password for each evaluator
      const tempPassword = crypto.randomBytes(4).toString("hex");

      // Store evaluator in database
      await db.ref(`evaluators/${evaluatorId}`).set({
        ...evaluator,
        password: tempPassword, // Store password for reference
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      evaluatorIds.push(evaluatorId);
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
      { status: 201 },
    );
  } catch (e: unknown) {
    return createErrorResponse(e, {
      operation: "POST /api/admin/seed (Seed Database)",
      resourceType: "Database Seed",
      path: "/api/admin/seed",
    });
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
  } catch (e: unknown) {
    return createErrorResponse(e, {
      operation: "GET /api/admin/seed (Database Stats)",
      resourceType: "Database",
      path: "/api/admin/seed",
    });
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
  } catch (e: unknown) {
    return createErrorResponse(e, {
      operation: "DELETE /api/admin/seed (Clear Database)",
      resourceType: "Database",
      path: "/api/admin/seed",
    });
  }
}
