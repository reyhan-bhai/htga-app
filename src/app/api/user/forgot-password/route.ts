import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { sendNotificationEmail } from "@/lib/emailService";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // 1. Find the user by email
    const snapshot = await db
      .ref("evaluators")
      .orderByChild("email")
      .equalTo(email)
      .once("value");

    const data = snapshot.val();

    if (!data) {
      // Security: Don't reveal if email exists or not
      return NextResponse.json(
        { message: "If that email exists, we sent a link." },
        { status: 200 }
      );
    }

    // Get the User ID (e.g., JEVA01)
    const userId = Object.keys(data)[0];
    const user = data[userId];

    // 2. Generate Reset Token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    // 3. Save Token to DB
    await db.ref(`evaluators/${userId}`).update({
      resetToken,
      resetTokenExpiry,
    });

    // 4. Send Email
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}&email=${email}`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #A67C37;">Password Reset Request</h2>
        <p>Hello ${user.name},</p>
        <p>We received a request to reset your password for the HTGA Evaluator Portal.</p>
        <p>Click the button below to set a new password:</p>
        <a href="${resetLink}" style="background-color: #A67C37; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Reset Password</a>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">This link triggers a secure password reset and expires in 1 hour.</p>
        <p style="font-size: 12px; color: #666;">If you didn't ask for this, you can safely ignore this email.</p>
      </div>
    `;

    await sendNotificationEmail(
      email,
      "Reset your password",
      `Click here to reset: ${resetLink}`,
      emailHtml
    );

    return NextResponse.json({ message: "Email sent" }, { status: 200 });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}