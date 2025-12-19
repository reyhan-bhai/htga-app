import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

// GET - Ambil semua tokens atau tokens per user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (userId) {
      // Get token for specific user from evaluators/{userId}/fcmTokens
      const tokenRef = db.ref(`evaluators/${userId}/fcmTokens`);
      const snapshot = await tokenRef.once("value");
      const token = snapshot.val();

      const tokens: string[] = [];
      if (token && typeof token === "string") {
        tokens.push(token);
      }

      return NextResponse.json({
        userId,
        tokens,
        count: tokens.length,
      });
    } else {
      // Get all tokens from all users under evaluators/*/fcmTokens
      const evaluatorsRef = db.ref("evaluators");
      const snapshot = await evaluatorsRef.once("value");
      const allEvaluators = snapshot.val() || {};

      // Flatten all user tokens
      const tokens: string[] = [];
      Object.values(allEvaluators).forEach((evaluatorData: any) => {
        if (
          evaluatorData &&
          evaluatorData.fcmTokens &&
          typeof evaluatorData.fcmTokens === "string"
        ) {
          tokens.push(evaluatorData.fcmTokens);
        }
      });

      return NextResponse.json({ tokens, count: tokens.length });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Tambah token untuk user
export async function POST(request: Request) {
  try {
    const { token, userId } = await request.json();

    if (!token) throw new Error("Token is required");
    if (!userId) throw new Error("UserId is required");

    const tokenRef = db.ref(`evaluators/${userId}/fcmTokens`);

    // Save token string directly
    await tokenRef.set(token);

    return NextResponse.json({
      message: "Token saved",
      userId,
      totalTokens: 1,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Hapus token
export async function DELETE(request: Request) {
  try {
    const { token, userId } = await request.json();

    if (!userId) throw new Error("UserId is required");

    const tokenRef = db.ref(`evaluators/${userId}/fcmTokens`);

    await tokenRef.remove();

    return NextResponse.json({
      message: "Token removed",
      userId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
