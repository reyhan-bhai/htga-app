import admin, { db } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const token = searchParams.get("token");

    if (!email || !token) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const snapshot = await db
      .ref("evaluators")
      .orderByChild("email")
      .equalTo(email)
      .once("value");

    const data = snapshot.val();
    if (!data) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const userId = Object.keys(data)[0];
    const user = data[userId];

    if (user.resetToken !== token) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    if (Date.now() > (user.resetTokenExpiry || 0)) {
      return NextResponse.json({ error: "Token has expired" }, { status: 400 });
    }

    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error("Token Validation Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { email, token, newPassword } = await request.json();

    if (!email || !token || !newPassword) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 1. Find user by email
    const snapshot = await db
      .ref("evaluators")
      .orderByChild("email")
      .equalTo(email)
      .once("value");

    const data = snapshot.val();
    if (!data) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const userId = Object.keys(data)[0];
    const user = data[userId];

    // 2. Verify Token and Expiry
    if (user.resetToken !== token) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 },
      );
    }

    if (Date.now() > (user.resetTokenExpiry || 0)) {
      return NextResponse.json({ error: "Token has expired" }, { status: 400 });
    }

    // 3. Update Firebase Auth (Firebase handles hashing internally)
    if (user.firebaseUid) {
      await admin.auth().updateUser(user.firebaseUid, {
        password: newPassword, // DON'T hash here, Firebase handles it
      });
    } else {
      return NextResponse.json(
        { error: "User configuration error (No UID)" },
        { status: 500 },
      );
    }

    // 4. Update Realtime DB (Sync & clear token)
    // Note: Storing password in Realtime DB is generally discouraged,
    // but keeping consistency with your existing code's logic.
    await db.ref(`evaluators/${userId}`).update({
      resetToken: null,
      resetTokenExpiry: null,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json(
      { message: "Password updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Reset Password Error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 },
    );
  }
}
