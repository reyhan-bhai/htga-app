import admin from "firebase-admin";

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const databaseURL = process.env.FIREBASE_DATABASE_URL;

  if (!projectId || !privateKey || !clientEmail || !databaseURL) {
    throw new Error("Missing Firebase Admin credentials");
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      privateKey: privateKey.replace(/\\n/g, "\n"),
      clientEmail,
    }),
    databaseURL: databaseURL,
  });
}

export const db = admin.database();
export default admin;
