import admin, { db } from "@/lib/firebase-admin";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

interface RegisterAdminBody {
  name: string;
  email: string;
  password?: string;
  role?: "admin" | "superadmin";
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

const ensureEmailAvailable = async (email: string): Promise<void> => {
  const [adminsSnap, superadminsSnap] = await Promise.all([
    db.ref("admins").once("value"),
    db.ref("superadmins").once("value"),
  ]);

  const adminsData = adminsSnap.val() as Record<
    string,
    { email: string }
  > | null;
  const superadminsData = superadminsSnap.val() as Record<
    string,
    { email: string }
  > | null;

  if (adminsData) {
    const exists = Object.values(adminsData).some((a) => a.email === email);
    if (exists) throw new Error("An admin with this email already exists");
  }
  if (superadminsData) {
    const exists = Object.values(superadminsData).some(
      (a) => a.email === email,
    );
    if (exists) throw new Error("A superadmin with this email already exists");
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

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as RegisterAdminBody;
    const name = body.name?.trim();
    const email = body.email?.trim();
    const role: "admin" | "superadmin" = body.role ?? "admin";
    const requestedPassword = body.password?.trim();

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 },
      );
    }
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    await ensureEmailAvailable(email);

    const password = requestedPassword || generatePassword(12);
    const hashedPassword = await bcrypt.hash(password, 10);

    const firebaseUser = await admin.auth().createUser({
      email,
      password,
      displayName: name,
      disabled: false,
    });

    await admin.auth().setCustomUserClaims(firebaseUser.uid, { role });

    const now = new Date().toISOString();
    const collection = role === "superadmin" ? "superadmins" : "admins";

    await db.ref(`${collection}/${firebaseUser.uid}`).set({
      name,
      email,
      role,
      firebaseUid: firebaseUser.uid,
      isActive: true,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(
      {
        message: "Admin created",
        id: firebaseUser.uid,
        password,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Registration failed";
    console.error("Superadmin register-admin error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
