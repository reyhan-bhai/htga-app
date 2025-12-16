import { NextRequest, NextResponse } from "next/server";
import admin from "@/lib/firebase-admin";
import { generateSecurePassword } from "@/lib/utils";
import { sendEvaluatorCredentials } from "@/lib/emailService";

interface CreateEvaluatorRequest {
  email: string;
  displayName?: string;
  specialties?: string[];
  maxAssignments?: number;
}

/**
 * POST /api/admin/create-evaluator
 * Create a new evaluator user with Firebase Auth and send credentials via email
 */
export async function POST(request: NextRequest) {
  console.log("📥 Received create-evaluator request");

  try {
    // Parse request body
    const body: CreateEvaluatorRequest = await request.json();
    const { email, displayName, specialties, maxAssignments } = body;

    // Validate required fields
    if (!email) {
      console.error("❌ Validation error: Email is required");
      return NextResponse.json(
        {
          error: "Validation Error",
          message: "Email is required",
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error(`❌ Validation error: Invalid email format: ${email}`);
      return NextResponse.json(
        {
          error: "Validation Error",
          message: "Invalid email format",
        },
        { status: 400 }
      );
    }

    console.log(`👤 Creating evaluator for email: ${email}`);

    // Step 1: Generate secure password
    let password: string;
    try {
      password = generateSecurePassword(12);
      console.log("✅ Password generated successfully");
    } catch (error: any) {
      console.error("❌ Error generating password:", error);
      return NextResponse.json(
        {
          error: "Password Generation Error",
          message: error.message || "Failed to generate password",
        },
        { status: 500 }
      );
    }

    // Step 2: Create user in Firebase Auth
    let userRecord;
    try {
      userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: displayName || undefined,
        emailVerified: false,
      });
      console.log(`✅ User created in Firebase Auth. UID: ${userRecord.uid}`);
    } catch (error: any) {
      console.error("❌ Error creating user in Firebase Auth:", error);

      // Handle specific Firebase Auth errors
      if (error.code === "auth/email-already-exists") {
        return NextResponse.json(
          {
            error: "User Already Exists",
            message: `Email ${email} is already registered`,
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error: "Firebase Auth Error",
          message: error.message || "Failed to create user in Firebase Auth",
          code: error.code,
        },
        { status: 500 }
      );
    }

    // Step 3: Set custom claims (role: evaluator)
    try {
      await admin.auth().setCustomUserClaims(userRecord.uid, {
        role: "evaluator",
        createdBy: "admin",
        createdAt: new Date().toISOString(),
      });
      console.log("✅ Custom claims set successfully");
    } catch (error: any) {
      console.error("❌ Error setting custom claims:", error);
      // Don't fail the entire operation for this
    }

    // Step 4: Save evaluator data to Realtime Database
    try {
      const evaluatorData = {
        email,
        displayName: displayName || null,
        specialties: specialties || [],
        maxAssignments: maxAssignments || null,
        role: "evaluator",
        uid: userRecord.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "admin",
      };

      const db = admin.database();
      await db.ref(`evaluators/${userRecord.uid}`).set(evaluatorData);
      console.log("✅ Evaluator data saved to Realtime Database");
    } catch (error: any) {
      console.error("❌ Error saving to Realtime Database:", error);
      // Rollback: Delete the created user
      try {
        await admin.auth().deleteUser(userRecord.uid);
        console.log("🔄 Rolled back: User deleted from Firebase Auth");
      } catch (rollbackError) {
        console.error("❌ Error during rollback:", rollbackError);
      }

      return NextResponse.json(
        {
          error: "Database Error",
          message: "Failed to save evaluator data. User creation rolled back.",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Step 5: Send credentials via email
    let emailResult;
    try {
      emailResult = await sendEvaluatorCredentials(email, email, password);

      if (!emailResult.success) {
        console.error("❌ Failed to send email:", emailResult.error);
        // Don't fail the entire operation, but log the error
        return NextResponse.json(
          {
            success: true,
            warning: "User created but email failed to send",
            message:
              "Evaluator created successfully, but failed to send credentials email",
            data: {
              uid: userRecord.uid,
              email: userRecord.email,
              displayName: userRecord.displayName,
            },
            emailError: emailResult.error,
            credentials: {
              email,
              password, // Include password in response since email failed
            },
          },
          { status: 201 }
        );
      }

      console.log(
        `✅ Credentials email sent successfully. Message ID: ${emailResult.messageId}`
      );
    } catch (error: any) {
      console.error("❌ Error sending email:", error);
      // Return success with warning since user was created
      return NextResponse.json(
        {
          success: true,
          warning: "User created but email failed to send",
          message:
            "Evaluator created successfully, but failed to send credentials email",
          data: {
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
          },
          emailError: error.message,
          credentials: {
            email,
            password, // Include password in response since email failed
          },
        },
        { status: 201 }
      );
    }

    // Success response
    console.log("✅ Evaluator created successfully");
    return NextResponse.json(
      {
        success: true,
        message:
          "Evaluator created successfully and credentials sent via email",
        data: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          emailSent: true,
          messageId: emailResult.messageId,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("❌ Unexpected error in create-evaluator:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error.message || "An unexpected error occurred",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/create-evaluator
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: "/api/admin/create-evaluator",
    method: "POST",
    description: "Create a new evaluator user and send credentials via email",
    requiredFields: ["email"],
    optionalFields: ["displayName", "specialties", "maxAssignments"],
  });
}
