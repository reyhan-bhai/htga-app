import { NextResponse } from "next/server";
import admin, { db } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, phone, company } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // 1. Find user by email
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

    // 2. Update Realtime Database
    await db.ref(`evaluators/${userId}`).update({
      name,
      phone,
      company,
      updatedAt: new Date().toISOString(),
    });

    // 3. Update Firebase Auth Profile (DisplayName)
    if (user.firebaseUid) {
      try {
        await admin.auth().updateUser(user.firebaseUid, {
          displayName: name,
        });
      } catch (authError) {
        console.error("Failed to update Firebase Auth profile:", authError);
        // Continue even if Auth update fails, as DB is primary for this app
      }
    }

    return NextResponse.json({ 
      message: "Profile updated successfully",
      user: { name, email, phone, company } 
    }, { status: 200 });

  } catch (error) {
    console.error("Update Profile Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}