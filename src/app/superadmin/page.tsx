"use client";

import SuperadminHeader from "@/components/superadmin/SuperadminHeader";
import SuperadminModal from "@/components/superadmin/Superadminmodal";
import SuperadminTable, {
  SuperadminAdminRow,
} from "@/components/superadmin/SuperadminTable";
import { Button, Input } from "@nextui-org/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import { useAuth } from "@/context/AuthContext";

interface AdminAccount {
  id: string;
  email: string;
  name: string;
  role: "admin" | "superadmin";
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

interface ApiListResponse {
  admins: AdminAccount[];
  count: number;
}

type AdminModalMode = "add" | "edit" | "view";

type AdminFormPayload = {
  id?: string;
  name: string;
  email: string;
  role: AdminAccount["role"];
  password?: string;
};

export default function SuperadminPage() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [query, setQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<AdminModalMode>("add");
  const [activeAdmin, setActiveAdmin] = useState<AdminFormPayload | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminAccount | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return admins;
    return admins.filter((a) => {
      return (
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q)
      );
    });
  }, [admins, query]);

  const rows = useMemo((): SuperadminAdminRow[] => {
    return filtered.map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      role: a.role,
      isActive: a.isActive,
    }));
  }, [filtered]);

  const loadAdmins = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/superadmin/admins", { cache: "no-store" });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error || "Failed to load admins");
      }
      const data = (await res.json()) as ApiListResponse;
      setAdmins(data.admins);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load admins";
      await Swal.fire({
        icon: "error",
        title: "Could not load admins",
        text: message,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAdmins();
  }, [loadAdmins]);

  const openAddModal = useCallback((): void => {
    setActiveAdmin({ name: "", email: "", password: "", role: "admin" });
    setModalMode("add");
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback(
    (adminRow: SuperadminAdminRow): void => {
      const found = admins.find((a) => a.id === adminRow.id);
      if (!found) return;
      setActiveAdmin({
        id: found.id,
        name: found.name,
        email: found.email,
        role: found.role,
      });
      setModalMode("edit");
      setModalOpen(true);
    },
    [admins],
  );

  const openViewModal = useCallback(
    (adminRow: SuperadminAdminRow): void => {
      const found = admins.find((a) => a.id === adminRow.id);
      if (!found) return;
      setActiveAdmin({
        id: found.id,
        name: found.name,
        email: found.email,
        role: found.role,
      });
      setModalMode("view");
      setModalOpen(true);
    },
    [admins],
  );

  const handleSaveAdmin = useCallback(
    async (data: Partial<AdminFormPayload>): Promise<void> => {
      const name = String(data.name ?? "").trim();
      const email = String(data.email ?? "").trim();
      const role = (data.role as AdminAccount["role"] | undefined) ?? "admin";
      const password = String(data.password ?? "").trim();

      if (!name || !email) {
        await Swal.fire({
          icon: "warning",
          title: "Missing fields",
          text: "Name and email are required.",
        });
        return;
      }

      setIsSubmitting(true);
      try {
        if (modalMode === "add") {
          if (!password) {
            await Swal.fire({
              icon: "warning",
              title: "Password required",
              text: "Password is required for new admin.",
            });
            return;
          }

          const res = await fetch("/api/superadmin/register-admin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, role, password }),
          });

          const body = (await res.json().catch(() => null)) as {
            error?: string;
            password?: string;
          } | null;
          if (!res.ok) throw new Error(body?.error || "Failed to create admin");

          await Swal.fire({
            icon: "success",
            title: "Admin created",
            html: `Password: <b>${password}</b><br/>Ask the admin to log in with this password.`,
          });
        } else if (modalMode === "edit") {
          const id = String(data.id ?? activeAdmin?.id ?? "");
          if (!id) throw new Error("Missing admin id");

          const res = await fetch(`/api/superadmin/admins?id=${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, role }),
          });
          const body = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          if (!res.ok) throw new Error(body?.error || "Failed to update admin");
          await Swal.fire({ icon: "success", title: "Updated" });
        }

        setModalOpen(false);
        await loadAdmins();
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed";
        await Swal.fire({ icon: "error", title: "Save failed", text: message });
      } finally {
        setIsSubmitting(false);
      }
    },
    [activeAdmin?.id, loadAdmins, modalMode],
  );

  const openDeleteModal = useCallback(
    (row: SuperadminAdminRow) => {
      const target = admins.find((a) => a.id === row.id);
      if (target) {
        setDeleteTarget(target);
        setDeleteOpen(true);
      }
    },
    [admins],
  );

  const confirmDelete = useCallback(async (): Promise<void> => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/superadmin/admins?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) throw new Error(body?.error || "Failed to delete admin");
      await Swal.fire({ icon: "success", title: "Deleted" });
      setDeleteOpen(false);
      setDeleteTarget(null);
      await loadAdmins();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to delete admin";
      await Swal.fire({ icon: "error", title: "Delete failed", text: message });
    } finally {
      setIsSubmitting(false);
    }
  }, [deleteTarget, loadAdmins]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6">
        <SuperadminHeader
          title={`Hello, ${user?.name || "Processing Officer"}`}
        />

        <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <Input
            value={query}
            onValueChange={setQuery}
            placeholder="Search by name/email/role"
            className="sm:max-w-md"
          />
          <Button
            className="bg-blue-600 text-white font-semibold"
            onPress={openAddModal}
          >
            Add Admin
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4">
        <SuperadminTable
          isLoading={isLoading}
          data={rows}
          onEdit={openEditModal}
          onView={openViewModal}
          onDelete={openDeleteModal}
        />
      </div>

      <SuperadminModal<AdminFormPayload>
        type="admin"
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={(data) => void handleSaveAdmin(data)}
        entity={activeAdmin}
        mode={modalMode}
        isLoading={isSubmitting}
      />

      <SuperadminModal
        type="delete"
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        entityName={
          deleteTarget
            ? `${deleteTarget.name} (${deleteTarget.email})`
            : "admin"
        }
        onConfirm={() => void confirmDelete()}
        isLoading={isSubmitting}
      />
    </div>
  );
}
