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
        return NextResponse.json(
          { error: "Evaluator not found" },
          { status: 404 },
        );
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
      city,
      position,
      company,
      specialties,
      maxAssignments,
    } = body;

    // Validation
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 },
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
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
        return NextResponse.json(
          { error: "An evaluator with this email already exists" },
          { status: 400 },
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
          process.env.DOCUSIGN_BASE64_DOCUMENT ||
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
      city, 
      position,
      company,
      specialties,
      maxAssignments,
      regeneratePassword,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Evaluator ID is required" },
        { status: 400 },
      );
    }

    // Check if evaluator exists
    const snapshot = await db.ref(`evaluators/${id}`).once("value");
    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: "Evaluator not found" },
        { status: 404 },
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
          { status: 400 },
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
            return NextResponse.json(
              { error: "An evaluator with this email already exists" },
              { status: 400 },
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
          process.env.DOCUSIGN_BASE64_DOCUMENT ||
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
        { status: 400 },
      );
    }

    // Check if evaluator exists in database
    const snapshot = await db.ref(`evaluators/${id}`).once("value");
    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: "Evaluator not found" },
        { status: 404 },
      );
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
      return NextResponse.json(
        {
          error:
            "Cannot delete evaluator with existing assignments. Please reassign or delete assignments first.",
        },
        { status: 400 },
      );
    }

    // Get the Firebase UID from the evaluator data
    const firebaseUid = evaluatorData.firebaseUid;

    if (!firebaseUid) {
      return NextResponse.json(
        {
          error:
            "Evaluator does not have a Firebase UID. Cannot delete from authentication.",
        },
        { status: 400 },
      );
    }

    // Delete from Firebase Authentication using the Firebase UID
    try {
      await admin.auth().deleteUser(firebaseUid);
    } catch (authError: any) {
      console.error("Error deleting Auth user:", authError);
      // If Auth deletion fails, do NOT delete from DB and return error for SweetAlert
      return NextResponse.json(
        {
          error:
            "Failed to delete evaluator from authentication. Please try again or contact support.",
          details: authError.message,
        },
        { status: 500 },
      );
    }

    // Only delete from Realtime Database if Auth deletion succeeded
    await db.ref(`evaluators/${id}`).remove();

    return NextResponse.json({
      message:
        "Evaluator deleted successfully from database and authentication.",
    });
  } catch (error: any) {
    console.error("Error deleting evaluator:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
