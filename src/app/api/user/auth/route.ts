import { sendEvaluatorCredentials } from "@/lib/emailService";
import admin, { db } from "@/lib/firebase-admin";
import { sendNDA } from "@/lib/nda-service";
import type { Evaluator } from "@/types/restaurant";
import { NextResponse } from "next/server";

interface RegisterRequestBody {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  specialties?: string[] | string;
}

type EvaluatorRecord = Omit<Evaluator, "id"> & { firebaseUid: string };

interface RegisterResponse {
  message: string;
  evaluator: Omit<Evaluator, "password"> & { id: string };
  emailSent: boolean;
  ndaSent: boolean;
  warning?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const generatePassword = (length: number = 12): string => {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*";
  const allChars = uppercase + lowercase + numbers + symbols;

  let password = "";
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  for (let i = password.length; i < length; i += 1) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
};

const normalizeSpecialties = (specialties?: string[] | string): string[] => {
  if (!specialties) {
    return [];
  }

  if (Array.isArray(specialties)) {
    return specialties.map((specialty) => specialty.trim()).filter(Boolean);
  }

  return specialties
    .split(",")
    .map((specialty) => specialty.trim())
    .filter(Boolean);
};

const ensureEmailAvailable = async (email: string): Promise<void> => {
  const existingEvaluators = await db.ref("evaluators").once("value");
  const evaluatorsData = existingEvaluators.val() as Record<
    string,
    EvaluatorRecord
  > | null;

  if (evaluatorsData) {
    const emailExists = Object.values(evaluatorsData).some(
      (evaluator) => evaluator.email === email
    );

    if (emailExists) {
      throw new Error("An evaluator with this email already exists");
    }
  }

  try {
    await admin.auth().getUserByEmail(email);
    throw new Error("An account with this email already exists");
  } catch (error: unknown) {
    const firebaseError = error as { code?: string };
    if (firebaseError.code !== "auth/user-not-found") {
      throw error;
    }
  }
};

const generateEvaluatorId = async (): Promise<string> => {
  const snapshot = await db.ref("evaluators").once("value");
  const evaluatorsData = snapshot.val() as Record<
    string,
    EvaluatorRecord
  > | null;

  if (!evaluatorsData) {
    return "JEVA01";
  }

  const ids = Object.keys(evaluatorsData);
  const numbers = ids
    .filter((id) => id.startsWith("JEVA"))
    .map((id) => parseInt(id.substring(4), 10))
    .filter((num) => !Number.isNaN(num));

  const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
  return `JEVA${String(maxNumber + 1).padStart(2, "0")}`;
};

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as RegisterRequestBody;
    const { name, email, phone, company, position, specialties } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    await ensureEmailAvailable(email);

    const evaluatorId = await generateEvaluatorId();

    const password = generatePassword();

    const firebaseUser = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    const evaluatorPayload: EvaluatorRecord = {
      name,
      email,
      phone,
      position,
      company,
      specialties: normalizeSpecialties(specialties),
      firebaseUid: firebaseUser.uid,
      password,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.ref(`evaluators/${evaluatorId}`).set(evaluatorPayload);

    const emailResult = await sendEvaluatorCredentials(email, email, password);

    let ndaSent = false;
    let warning: string | undefined;
    if (emailResult.success) {
      const documentBase64 = process.env.DOCUSIGN_BASE64_DOCUMENT;

      if (!documentBase64) {
        warning =
          "DOCUSIGN_BASE64_DOCUMENT is not configured; NDA could not be sent.";
      } else {
        try {
          await sendNDA({
            recipientEmail: email,
            recipientName: name,
            documentBase64,
          });
          ndaSent = true;
        } catch (error) {
          console.error("❌ Failed to send NDA:", error);
          warning = "Registration completed but NDA could not be sent.";
        }
      }
    }

    const responseBody: RegisterResponse = {
      message: "Registration completed successfully",
      evaluator: {
        id: evaluatorId,
        name: evaluatorPayload.name,
        email: evaluatorPayload.email,
        phone: evaluatorPayload.phone,
        position: evaluatorPayload.position,
        company: evaluatorPayload.company,
        specialties: evaluatorPayload.specialties,
        maxAssignments: evaluatorPayload.maxAssignments,
        createdAt: evaluatorPayload.createdAt,
        updatedAt: evaluatorPayload.updatedAt,
      },
      emailSent: emailResult.success,
      ndaSent,
      warning: emailResult.success
        ? warning
        : "Registration completed but credentials email could not be sent",
    };

    return NextResponse.json(responseBody, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Registration failed";
    console.error("Registration error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
