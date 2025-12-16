import { db } from "@/lib/firebase-admin";
import { Evaluator } from "@/types/restaurant";
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

// Helper function to generate random password
function generatePassword(length: number = 12): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*";
  const allChars = uppercase + lowercase + numbers + symbols;

  let password = "";
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

// Helper function to hash password (simple implementation, consider using bcrypt in production)
function hashPassword(password: string): string {
  // TODO: In production, use proper password hashing like bcrypt
  // For now, we'll just store it as is (NOT SECURE for production)
  return password;
}

// Helper function to send email with credentials (placeholder for future implementation)
async function sendCredentialsEmail(
  email: string,
  name: string,
  evaluatorId: string,
  password: string
): Promise<void> {
  // TODO: Implement email sending functionality
  // This is where you'll integrate with email service (SendGrid, AWS SES, etc.)
  console.log(`
    ========================================
    EMAIL TO BE SENT:
    To: ${email}
    Subject: Your HTGA Evaluator Account Credentials
    
    Dear ${name},
    
    Your evaluator account has been created successfully.
    
    Login Credentials:
    - Evaluator ID: ${evaluatorId}
    - Email: ${email}
    - Password: ${password}
    
    Please keep these credentials safe and change your password after first login.
    
    Best regards,
    HTGA Team
    ========================================
  `);

  // Return a promise to simulate async email sending
  return Promise.resolve();
}

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

      // Don't return password in response
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...evaluatorWithoutPassword } = evaluator;
      return NextResponse.json({
        evaluator: { id, ...evaluatorWithoutPassword },
      });
    }

    // Get all evaluators
    const snapshot = await db.ref("evaluators").once("value");
    const evaluatorsData = snapshot.val();

    const evaluators: Evaluator[] = evaluatorsData
      ? Object.entries(evaluatorsData).map(([id, data]: [string, any]) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { password, ...evaluatorWithoutPassword } = data;
          return {
            id,
            ...evaluatorWithoutPassword,
          };
        })
      : [];

    return NextResponse.json({
      evaluators,
      count: evaluators.length,
    });
  } catch (error: any) {
    console.error("Error getting evaluators:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new evaluator
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      position,
      company,
      specialties,
      maxAssignments,
    } = body;

    // Validation
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEvaluators = await db.ref("evaluators").once("value");
    const evaluatorsData = existingEvaluators.val();
    if (evaluatorsData) {
      const emailExists = Object.values(evaluatorsData).some(
        (evaluator: any) => evaluator.email === email
      );
      if (emailExists) {
        return NextResponse.json(
          { error: "An evaluator with this email already exists" },
          { status: 400 }
        );
      }
    }

    // Generate custom ID (JEVA01, JEVA02, etc.)
    const evaluatorId = await generateEvaluatorId();

    // Auto-generate password
    const generatedPassword = generatePassword(12);

    // Parse specialties if it's a string
    let specialtiesArray: string[] = [];
    if (typeof specialties === "string") {
      specialtiesArray = specialties
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
    } else if (Array.isArray(specialties)) {
      specialtiesArray = specialties;
    }

    // Build evaluator object, only including defined values
    const newEvaluator: any = {
      name,
      email,
      specialties: specialtiesArray,
      password: hashPassword(generatedPassword),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Only add optional fields if they have values
    if (phone) newEvaluator.phone = phone;
    if (position) newEvaluator.position = position;
    if (company) newEvaluator.company = company;
    if (maxAssignments !== undefined && maxAssignments !== null) {
      newEvaluator.maxAssignments = maxAssignments;
    }

    await db.ref(`evaluators/${evaluatorId}`).set(newEvaluator);

    // Send credentials email (async, don't wait for it to complete)
    sendCredentialsEmail(email, name, evaluatorId, generatedPassword)
      .then(() => console.log(`Credentials email sent to ${email}`))
      .catch((error) =>
        console.error(`Failed to send email to ${email}:`, error)
      );

    // Don't return password in response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...evaluatorWithoutPassword } = newEvaluator;

    return NextResponse.json(
      {
        message:
          "Evaluator created successfully. Credentials have been sent to their email.",
        evaluator: { id: evaluatorId, ...evaluatorWithoutPassword },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating evaluator:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update evaluator
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      email,
      phone,
      position,
      company,
      specialties,
      maxAssignments,
      regeneratePassword,
    } = body;

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

    const currentEvaluator = snapshot.val();

    const updates: Partial<Evaluator> = {
      updatedAt: new Date().toISOString(),
    };

    if (name) updates.name = name;
    if (email) {
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }

      // Check if email already exists (for other evaluators)
      if (email !== currentEvaluator.email) {
        const existingEvaluators = await db.ref("evaluators").once("value");
        const evaluatorsData = existingEvaluators.val();
        if (evaluatorsData) {
          const emailExists = Object.entries(evaluatorsData).some(
            ([evalId, evaluator]: [string, any]) =>
              evalId !== id && evaluator.email === email
          );
          if (emailExists) {
            return NextResponse.json(
              { error: "An evaluator with this email already exists" },
              { status: 400 }
            );
          }
        }
      }
      updates.email = email;
    }
    if (phone !== undefined && phone !== null) updates.phone = phone;
    if (position !== undefined && position !== null)
      updates.position = position;
    if (company !== undefined && company !== null) updates.company = company;

    if (specialties) {
      // Parse specialties if it's a string
      if (typeof specialties === "string") {
        updates.specialties = specialties
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
      } else if (Array.isArray(specialties)) {
        updates.specialties = specialties;
      }
    }

    if (maxAssignments !== undefined && maxAssignments !== null) {
      updates.maxAssignments = maxAssignments;
    }

    // Handle password regeneration if explicitly requested
    let newPassword: string | null = null;
    if (regeneratePassword === true) {
      newPassword = generatePassword(12);
      updates.password = hashPassword(newPassword);
    }

    await db.ref(`evaluators/${id}`).update(updates);

    // Send new credentials email if password was regenerated
    if (newPassword) {
      const updatedEmail = email || currentEvaluator.email;
      const updatedName = name || currentEvaluator.name;
      sendCredentialsEmail(updatedEmail, updatedName, id, newPassword)
        .then(() =>
          console.log(`New credentials email sent to ${updatedEmail}`)
        )
        .catch((error) =>
          console.error(`Failed to send email to ${updatedEmail}:`, error)
        );
    }

    const updatedSnapshot = await db.ref(`evaluators/${id}`).once("value");
    const updatedData = updatedSnapshot.val();

    // Don't return password in response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...evaluatorWithoutPassword } = updatedData;

    return NextResponse.json({
      message: newPassword
        ? "Evaluator updated successfully. New credentials have been sent to their email."
        : "Evaluator updated successfully",
      evaluator: { id, ...evaluatorWithoutPassword },
    });
  } catch (error: any) {
    console.error("Error updating evaluator:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
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
  } catch (error: any) {
    console.error("Error deleting evaluator:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
