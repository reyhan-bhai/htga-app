import { NextResponse } from "next/server";
import admin, { db } from "@/lib/firebase-admin";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
  try {
    const { email, oldPassword, newPassword } = await request.json();

    if (!email || !oldPassword || !newPassword) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 1. Find user
    const snapshot = await db
      .ref("evaluators")
      .orderByChild("email")
      .equalTo(email)
      .once("value");

    const data = snapshot.val();
    if (!data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = Object.keys(data)[0];
    const user = data[userId];

    // 2. Verify Old Password
    // If the DB has a hash (which we just implemented), compare hash.
    // If it has plain text (legacy), compare directly.
    const isMatch = user.password.startsWith("$2b$") 
      ? await bcrypt.compare(oldPassword, user.password)
      : user.password === oldPassword;

    if (!isMatch) {
      return NextResponse.json({ error: "Incorrect old password" }, { status: 400 });
    }

    // 3. Hash New Password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. Update Firebase Auth
    if (user.firebaseUid) {
      await admin.auth().updateUser(user.firebaseUid, {
        password: newPassword,
      });
    }

    // 5. Update Realtime DB
    await db.ref(`evaluators/${userId}`).update({
      password: hashedPassword,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ message: "Password updated" }, { status: 200 });
  } catch (error) {
    console.error("Change Password Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}