import admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const databaseURL = process.env.FIREBASE_DATABASE_URL;

  console.log("🔧 Firebase Admin initialization:", {
    projectId: projectId ? "✅" : "❌",
    privateKey: privateKey ? "✅" : "❌",
    clientEmail: clientEmail ? "✅" : "❌",
    databaseURL: databaseURL ? "✅" : "❌",
  });

  if (!projectId || !privateKey || !clientEmail || !databaseURL) {
    console.error("❌ Missing Firebase Admin credentials:", {
      projectId: !!projectId,
      privateKey: !!privateKey,
      clientEmail: !!clientEmail,
      databaseURL: !!databaseURL,
    });
    throw new Error("Missing Firebase Admin credentials");
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey: privateKey.replace(/\\n/g, "\n"),
        clientEmail,
      }),
      databaseURL: databaseURL,
    });
    console.log("✅ Firebase Admin initialized successfully");
  } catch (e) {
    console.error("❌ Firebase Admin initialization error:", e);
    throw e;
  }
}

// Export database instance after initialization
export const db = admin.database();
export default admin;
