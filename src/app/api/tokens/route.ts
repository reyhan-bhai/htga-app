import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

// GET - Ambil semua tokens atau tokens per user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (userId) {
      // Get tokens for specific user from evaluators/{userId}/fcmTokens
      const tokensRef = db.ref(`evaluators/${userId}/fcmTokens`);
      const snapshot = await tokensRef.once("value");
      const userTokensData = snapshot.val() || {};

      const tokens: string[] = [];
      Object.values(userTokensData).forEach((tokenData: any) => {
        if (tokenData && tokenData.token) {
          tokens.push(tokenData.token);
        }
      });

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
        if (evaluatorData && evaluatorData.fcmTokens) {
          Object.values(evaluatorData.fcmTokens).forEach((tokenData: any) => {
            if (tokenData && tokenData.token) {
              tokens.push(tokenData.token);
            }
          });
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

    const tokensRef = db.ref(`evaluators/${userId}/fcmTokens`);

    // Save token with timestamp
    const tokenId = token.substring(0, 20); // Use part of token as ID
    await tokensRef.child(tokenId).set({
      token,
      createdAt: Date.now(),
      lastUsed: Date.now(),
    });

    // Get total tokens for this user
    const snapshot = await tokensRef.once("value");
    const userTokens = snapshot.val() || {};

    return NextResponse.json({
      message: "Token saved",
      userId,
      totalTokens: Object.keys(userTokens).length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Hapus token
export async function DELETE(request: Request) {
  try {
    const { token, userId } = await request.json();

    if (!token) throw new Error("Token is required");
    if (!userId) throw new Error("UserId is required");

    const tokenId = token.substring(0, 20);
    const tokensRef = db.ref(`evaluators/${userId}/fcmTokens/${tokenId}`);

    await tokensRef.remove();

    return NextResponse.json({
      message: "Token removed",
      userId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
