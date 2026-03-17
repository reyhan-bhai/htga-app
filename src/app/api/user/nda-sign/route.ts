import admin, { db } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.substring(7);
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;

    const body = await request.json();
    const { signatureImage, agreedAt } = body;

    if (!signatureImage) {
      return NextResponse.json(
        { error: "Signature image is required" },
        { status: 400 },
      );
    }

    // Find evaluator by firebaseUid
    const snapshot = await db
      .ref("evaluators")
      .orderByChild("firebaseUid")
      .equalTo(firebaseUid)
      .once("value");

    const data = snapshot.val();
    if (!data) {
      return NextResponse.json(
        { error: "Evaluator not found" },
        { status: 404 },
      );
    }

    const evaluatorKey = Object.keys(data)[0];

    await db.ref(`evaluators/${evaluatorKey}/nda`).set({
      ndaSigned: true,
      ndaSignedAt: agreedAt || new Date().toISOString(),
      ndaSignatureImage: signatureImage,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("NDA Sign Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
