import { NDA_DOCUMENTS } from "@/constants/ndaDocs";
import {
  createConflictError,
  createErrorResponse,
  createNotFoundError,
  createValidationError,
} from "@/lib/api-error-handler";
import admin, { db } from "@/lib/firebase-admin";
import { sendNDA } from "@/lib/nda-service";
import { Evaluator } from "@/types/restaurant";
import bcrypt from "bcrypt";
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

// Helper function to send email with credentials
async function sendCredentialsEmail(
  email: string,
  name: string,
  evaluatorId: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Import the email service
    const { sendEvaluatorCredentials } = await import("@/lib/emailService");

    // Send the email using the email service
    const result = await sendEvaluatorCredentials(email, email, password);

    if (result.success) {
      console.log(`✅ Credentials email sent successfully to ${email}`);
      return { success: true };
    } else {
      console.error(`❌ Failed to send email to ${email}:`, result.error);
      return { success: false, error: result.error };
    }
  } catch (error: any) {
    console.error(`❌ Error sending email to ${email}:`, error);
    return { success: false, error: error.message };
  }
}

// GET - Get all evaluators or specific evaluator by ID
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      // Get specific evaluator by UID or custom ID
      const snapshot = await db.ref(`evaluators/${id}`).once("value");
      let evaluator = snapshot.val();
      let evaluatorId = id;

      // If not found by direct ID, search by firebaseUid
      if (!evaluator) {
        const allSnapshot = await db.ref("evaluators").once("value");
        const allEvaluators = allSnapshot.val();

        if (allEvaluators) {
          // Search for evaluator by firebaseUid
          const foundEntry = Object.entries(allEvaluators).find(
            ([, data]: [string, any]) =>
              data.firebaseUid === id || data.uid === id,
          );

          if (foundEntry) {
            [evaluatorId, evaluator] = foundEntry;
          }
        }
      }

      if (!evaluator) {
        return createNotFoundError("Evaluator", id, "/api/admin/evaluators");
      }

      // Don't return password in response
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...evaluatorWithoutPassword } = evaluator;
      return NextResponse.json({
        evaluator: { id: evaluatorId, ...evaluatorWithoutPassword },
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
  } catch (error: unknown) {
    return createErrorResponse(error, {
      operation: "GET /api/admin/evaluators",
      resourceType: "Evaluator",
      path: "/api/admin/evaluators",
    });
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
      city,
      position,
      company,
      specialties,
      maxAssignments,
    } = body;

    // Validation
    if (!name || !email) {
      return createValidationError(
        !name ? "name" : "email",
        "Name and email are required to create an evaluator",
        "/api/admin/evaluators",
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createValidationError(
        "email",
        `Invalid email format: '${email}'. Please provide a valid email address`,
        "/api/admin/evaluators",
      );
    }

    // Check if email already exists
    const existingEvaluators = await db.ref("evaluators").once("value");
    const evaluatorsData = existingEvaluators.val();
    if (evaluatorsData) {
      const emailExists = Object.values(evaluatorsData).some(
        (evaluator: any) => evaluator.email === email,
      );
      if (emailExists) {
        return createConflictError(
          `An evaluator with email '${email}' already exists`,
          "Please use a different email address or update the existing evaluator",
          "/api/admin/evaluators",
        );
      }
    }

    // Generate custom ID (JEVA01, JEVA02, etc.)
    const evaluatorId = await generateEvaluatorId();

    // Auto-generate password
    const generatedPassword = generatePassword(12);

    // Create Firebase Authentication user
    const firebaseUser = await admin.auth().createUser({
      email,
      password: generatedPassword,
      displayName: name,
    });

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

    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    // Build evaluator object, only including defined values
    const newEvaluator: any = {
      name,
      email,
      specialties: specialtiesArray,
      firebaseUid: firebaseUser.uid,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Only add optional fields if they have values
    if (phone) newEvaluator.phone = phone;
    if (position) newEvaluator.position = position;
    if (city) newEvaluator.position = position;
    if (company) newEvaluator.company = company;
    if (maxAssignments !== undefined && maxAssignments !== null) {
      newEvaluator.maxAssignments = maxAssignments;
    }

    await db.ref(`evaluators/${evaluatorId}`).set(newEvaluator);

    // Send credentials email
    const emailResult = await sendCredentialsEmail(
      email,
      name,
      evaluatorId,
      generatedPassword,
    );

    // Send NDA automatically ONLY if email was sent successfully
    if (emailResult.success) {
      try {
        const minimalPdfBase64 =
          NDA_DOCUMENTS ||
          "JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmogCjw8CiAgL1R5cGUgL1BhZ2VzCiAgL01lZGlhQm94IFsgMCAwIDIwMCAyMDAgXQogIC9Db3VudCAxCiAgL0tpZHMgWyAzIDAgUiBdCj4+CmVuZG9iagoKMyAwIG9iago8PAogIC9UeXBlIC9QYWdlCiAgL1BhcmVudCAyIDAgUgogIC9SZXNvdXJjZXMgPDwKICAgIC9Gb250IDw8CiAgICAgIC9FMSA0IDAgUgogICAgPj4KICA+PgogIC9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKCjQgMCBvYmogCjw8CiAgL1R5cGUgL0ZvbnQKICAvU3VidHlwZSAvVHlwZTEKICAvQmFzZUZvbnQgL1RpbWVzLVJvbWFuCj4+CmVuZG9iagoKNSAwIG9iago8PAogIC9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCjcwIDUwIFRECi9FMSAxMiBUZgooSGVsbG8gV29ybGQhKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCgp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTAgMDAwMDAgbiAKMDAwMDAwMDA2MCAwMDAwMCBuIAowMDAwMDAwMTU3IDAwMDAwIG4gCjAwMDAwMDAyNTUgMDAwMDAgbiAKMDAwMDAwMDM0NCAwMDAwMCBuIAp0cmFpbGVyCjw8CiAgL1NpemUgNgogIC9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo0MTMKJSVFT0YK";

        console.log(`📧 Sending NDA to new evaluator: ${email}`);
        await sendNDA({
          recipientEmail: email,
          recipientName: name,
          documentBase64: minimalPdfBase64,
        });
        console.log(`✅ NDA sent successfully to ${email}`);
      } catch (error) {
        console.error("❌ Failed to send NDA:", error);
        // We don't block creation if NDA fails, but we log it.
      }
    } else {
      console.warn(
        `⚠️ Skipping NDA sending for ${email} because credential email failed.`,
      );
    }

    // Don't return password in response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...evaluatorWithoutPassword } = newEvaluator;

    // If email failed, include warning in response
    if (!emailResult.success) {
      return NextResponse.json(
        {
          message:
            "Evaluator created successfully, but failed to send credentials email.",
          warning: emailResult.error,
          evaluator: { id: evaluatorId, ...evaluatorWithoutPassword },
          credentials: {
            email,
            password: generatedPassword, // Include password since email failed
          },
        },
        { status: 201 },
      );
    }

    return NextResponse.json(
      {
        message:
          "Evaluator created successfully. Credentials have been sent to their email.",
        evaluator: { id: evaluatorId, ...evaluatorWithoutPassword },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    return createErrorResponse(error, {
      operation: "POST /api/admin/evaluators (Create Evaluator)",
      resourceType: "Evaluator",
      path: "/api/admin/evaluators",
    });
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
      city,
      position,
      company,
      specialties,
      maxAssignments,
      regeneratePassword,
    } = body;

    if (!id) {
      return createValidationError(
        "id",
        "Evaluator ID is required for update operation",
        "/api/admin/evaluators",
      );
    }

    // Check if evaluator exists
    const snapshot = await db.ref(`evaluators/${id}`).once("value");
    if (!snapshot.exists()) {
      return createNotFoundError("Evaluator", id, "/api/admin/evaluators");
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
        return createValidationError(
          "email",
          `Invalid email format: '${email}'. Please provide a valid email address`,
          "/api/admin/evaluators",
        );
      }

      // Check if email already exists (for other evaluators)
      if (email !== currentEvaluator.email) {
        const existingEvaluators = await db.ref("evaluators").once("value");
        const evaluatorsData = existingEvaluators.val();
        if (evaluatorsData) {
          const emailExists = Object.entries(evaluatorsData).some(
            ([evalId, evaluator]: [string, any]) =>
              evalId !== id && evaluator.email === email,
          );
          if (emailExists) {
            return createConflictError(
              `An evaluator with email '${email}' already exists`,
              "Please use a different email address",
              "/api/admin/evaluators",
            );
          }
        }
      }
      updates.email = email;
    }
    if (phone !== undefined && phone !== null) updates.phone = phone;
    if (city !== undefined && city !== null) updates.city = city;
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
      updates.password = await bcrypt.hash(newPassword, 10);
    }

    await db.ref(`evaluators/${id}`).update(updates);

    // Send NDA if email has changed
    if (email && email !== currentEvaluator.email) {
      try {
        const minimalPdfBase64 =
          NDA_DOCUMENTS ||
          "JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmogCjw8CiAgL1R5cGUgL1BhZ2VzCiAgL01lZGlhQm94IFsgMCAwIDIwMCAyMDAgXQogIC9Db3VudCAxCiAgL0tpZHMgWyAzIDAgUiBdCj4+CmVuZG9iagoKMyAwIG9iago8PAogIC9UeXBlIC9QYWdlCiAgL1BhcmVudCAyIDAgUgogIC9SZXNvdXJjZXMgPDwKICAgIC9Gb250IDw8CiAgICAgIC9FMSA0IDAgUgogICAgPj4KICA+PgogIC9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKCjQgMCBvYmogCjw8CiAgL1R5cGUgL0ZvbnQKICAvU3VidHlwZSAvVHlwZTEKICAvQmFzZUZvbnQgL1RpbWVzLVJvbWFuCj4+CmVuZG9iagoKNSAwIG9iago8PAogIC9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCjcwIDUwIFRECi9FMSAxMiBUZgooSGVsbG8gV29ybGQhKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCgp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTAgMDAwMDAgbiAKMDAwMDAwMDA2MCAwMDAwMCBuIAowMDAwMDAwMTU3IDAwMDAwIG4gCjAwMDAwMDAyNTUgMDAwMDAgbiAKMDAwMDAwMDM0NCAwMDAwMCBuIAp0cmFpbGVyCjw8CiAgL1NpemUgNgogIC9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo0MTMKJSVFT0YK";

        console.log(`📧 Email changed. Sending new NDA to: ${email}`);
        await sendNDA({
          recipientEmail: email,
          recipientName: name || currentEvaluator.name,
          documentBase64: minimalPdfBase64,
        });
        console.log(`✅ NDA sent successfully to new email ${email}`);
      } catch (error) {
        console.error("❌ Failed to send NDA to new email:", error);
      }
    }

    // Send new credentials email if password was regenerated
    let emailSent = false;
    if (newPassword) {
      const updatedEmail = email || currentEvaluator.email;
      const updatedName = name || currentEvaluator.name;
      const emailResult = await sendCredentialsEmail(
        updatedEmail,
        updatedName,
        id,
        newPassword,
      );
      emailSent = emailResult.success;
    }

    const updatedSnapshot = await db.ref(`evaluators/${id}`).once("value");
    const updatedData = updatedSnapshot.val();

    // Don't return password in response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...evaluatorWithoutPassword } = updatedData;

    let message = "Evaluator updated successfully";
    if (newPassword) {
      message = emailSent
        ? "Evaluator updated successfully. New credentials have been sent to their email."
        : "Evaluator updated successfully, but failed to send credentials email.";
    }

    return NextResponse.json({
      message,
      evaluator: { id, ...evaluatorWithoutPassword },
    });
  } catch (error: unknown) {
    return createErrorResponse(error, {
      operation: "PUT /api/admin/evaluators (Update Evaluator)",
      resourceType: "Evaluator",
      path: "/api/admin/evaluators",
    });
  }
}

// DELETE - Delete evaluator
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return createValidationError(
        "id",
        "Evaluator ID is required for delete operation",
        "/api/admin/evaluators",
      );
    }

    // Check if evaluator exists in database
    const snapshot = await db.ref(`evaluators/${id}`).once("value");
    if (!snapshot.exists()) {
      return createNotFoundError("Evaluator", id, "/api/admin/evaluators");
    }

    const evaluatorData = snapshot.val();

    // Check if evaluator has assignments (existing logic)
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
      return createConflictError(
        `Cannot delete evaluator '${id}' with existing assignments`,
        "Please reassign or delete the evaluator's assignments first before deleting the evaluator",
        "/api/admin/evaluators",
      );
    }

    // Get the Firebase UID from the evaluator data
    const firebaseUid = evaluatorData.firebaseUid;

    if (!firebaseUid) {
      return createValidationError(
        "firebaseUid",
        `Evaluator '${id}' does not have a Firebase UID. Cannot delete from authentication. This evaluator may have been created incorrectly.`,
        "/api/admin/evaluators",
      );
    }

    // Delete from Firebase Authentication using the Firebase UID
    try {
      await admin.auth().deleteUser(firebaseUid);
    } catch (authError: unknown) {
      return createErrorResponse(authError, {
        operation: "DELETE /api/admin/evaluators (Firebase Auth Delete)",
        resourceType: "Evaluator",
        resourceId: id,
        path: "/api/admin/evaluators",
      });
    }

    // Only delete from Realtime Database if Auth deletion succeeded
    await db.ref(`evaluators/${id}`).remove();

    return NextResponse.json({
      message:
        "Evaluator deleted successfully from database and authentication.",
    });
  } catch (error: unknown) {
    return createErrorResponse(error, {
      operation: "DELETE /api/admin/evaluators",
      resourceType: "Evaluator",
      path: "/api/admin/evaluators",
    });
  }
}
