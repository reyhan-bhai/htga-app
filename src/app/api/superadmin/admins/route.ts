import admin, { db } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

interface AdminRecord {
  name: string;
  email: string;
  role: "admin" | "superadmin";
  firebaseUid: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

const pickAdminResponse = (
  id: string,
  data: AdminRecord,
): Omit<AdminRecord, "firebaseUid"> & { id: string } => {
  return {
    id,
    name: data.name,
    email: data.email,
    role: data.role,
    isActive: data.isActive,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    lastLoginAt: data.lastLoginAt,
  };
};

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      // Try finding in admins first
      let snap = await db.ref(`admins/${id}`).once("value");
      let data = snap.val() as AdminRecord | null;

      // If not found, try superadmins
      if (!data) {
        snap = await db.ref(`superadmins/${id}`).once("value");
        data = snap.val() as AdminRecord | null;
      }

      if (!data) {
        return NextResponse.json({ error: "Admin not found" }, { status: 404 });
      }
      return NextResponse.json({ admin: pickAdminResponse(id, data) });
    }

    const [adminsSnap, superadminsSnap] = await Promise.all([
      db.ref("admins").once("value"),
      db.ref("superadmins").once("value"),
    ]);

    const adminsData = adminsSnap.val() as Record<string, AdminRecord> | null;
    const superadminsData = superadminsSnap.val() as Record<
      string,
      AdminRecord
    > | null;

    const list: (Omit<AdminRecord, "firebaseUid"> & { id: string })[] = [];

    if (adminsData) {
      Object.entries(adminsData).forEach(([key, val]) => {
        list.push(pickAdminResponse(key, val));
      });
    }
    if (superadminsData) {
      Object.entries(superadminsData).forEach(([key, val]) => {
        list.push(pickAdminResponse(key, val));
      });
    }

    list.sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));

    return NextResponse.json({ admins: list, count: list.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed";
    console.error("GET /api/superadmin/admins error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const body = (await request.json()) as Partial<
      Pick<AdminRecord, "name" | "role">
    >;
    const name = body.name?.trim();
    const role = body.role;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    let collection = "admins";
    let snap = await db.ref(`admins/${id}`).once("value");
    let existing = snap.val() as AdminRecord | null;

    if (!existing) {
      collection = "superadmins";
      snap = await db.ref(`superadmins/${id}`).once("value");
      existing = snap.val() as AdminRecord | null;
    }

    if (!existing) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Prepare common updates
    const updates: Partial<AdminRecord> = {
      name,
      updatedAt: new Date().toISOString(),
    };

    // If role changed, we need to move the record
    if (role && role !== existing.role) {
      const newCollection = role === "superadmin" ? "superadmins" : "admins";
      const newRecord = { ...existing, ...updates, role };

      // Write to new location
      await db.ref(`${newCollection}/${id}`).set(newRecord);
      // Remove from old location
      await db.ref(`${collection}/${id}`).remove();
    } else {
      // Just update in place
      await db.ref(`${collection}/${id}`).update(updates);
    }

    await admin.auth().updateUser(id, { displayName: name });
    if (role) {
      await admin.auth().setCustomUserClaims(id, { role });
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed";
    console.error("PUT /api/superadmin/admins error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const body = (await request.json()) as Partial<
      Pick<AdminRecord, "isActive">
    >;
    if (typeof body.isActive !== "boolean") {
      return NextResponse.json(
        { error: "isActive must be boolean" },
        { status: 400 },
      );
    }

    let collection = "admins";
    let snap = await db.ref(`admins/${id}`).once("value");
    let existing = snap.val() as AdminRecord | null;

    if (!existing) {
      collection = "superadmins";
      snap = await db.ref(`superadmins/${id}`).once("value");
      existing = snap.val() as AdminRecord | null;
    }

    if (!existing) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    await db.ref(`${collection}/${id}`).update({
      isActive: body.isActive,
      updatedAt: new Date().toISOString(),
    });
    await admin.auth().updateUser(id, { disabled: !body.isActive });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed";
    console.error("PATCH /api/superadmin/admins error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // Try deleting from both collections to be safe, or check first.
    // Simpler is to check which it is, but deleting from both ensures cleanup/
    // Let's check first to know if we found it? Or just Promise.all delete.
    // Promise.all is faster.
    await Promise.all([
      db.ref(`admins/${id}`).remove(),
      db.ref(`superadmins/${id}`).remove(),
    ]);

    try {
      await admin.auth().deleteUser(id);
    } catch (e) {
      console.warn("Failed to delete auth user:", e);
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed";
    console.error("DELETE /api/superadmin/admins error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
