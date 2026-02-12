"use client";

import AdminModal from "@/components/admin/AdminModal";
import AdminTable from "@/components/admin/AdminTable";
import { db } from "@/lib/firebase";
import { Button, Pagination } from "@nextui-org/react";
import { onValue, ref } from "firebase/database";
import React, { useEffect, useState } from "react";
import { MdAdd, MdLink, MdMenuBook, MdSearch } from "react-icons/md";
import Swal from "sweetalert2";

interface HandbookDocument {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  uploadedAt: string;
  updatedAt?: string;
  isActive: boolean;
  order: number;
}

export default function HandbookPage() {
  const [documents, setDocuments] = useState<HandbookDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedDocument, setSelectedDocument] =
    useState<HandbookDocument | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Firebase real-time listener
  useEffect(() => {
    const handbooksRef = ref(db, "handbooks");

    const unsubscribe = onValue(handbooksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list: HandbookDocument[] = Object.entries(data)
          .map(([id, val]: [string, any]) => ({
            id,
            ...val,
          }))
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        setDocuments(list);
      } else {
        setDocuments([]);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredDocuments.length / rowsPerPage);
  const paginatedDocuments = filteredDocuments.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  // Handlers
  const handleAdd = () => {
    setSelectedDocument(null);
    setModalMode("add");
    setIsModalOpen(true);
  };

  const handleEdit = (doc: HandbookDocument) => {
    setSelectedDocument(doc);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleDelete = async (doc: HandbookDocument) => {
    const result = await Swal.fire({
      title: "Delete Document?",
      html: `Are you sure you want to delete <strong>${doc.title}</strong>?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/admin/handbook?id=${doc.id}`, {
          method: "DELETE",
        });
        const data = await response.json();

        if (response.ok) {
          Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "Document has been deleted.",
            confirmButtonColor: "#A67C37",
          });
          // Firebase listener will auto-update the list
        } else {
          throw new Error(data.error || "Failed to delete");
        }
      } catch (error: any) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message,
          confirmButtonColor: "#A67C37",
        });
      }
    }
  };

  const handleToggleActive = async (doc: HandbookDocument) => {
    try {
      const response = await fetch("/api/admin/handbook", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: doc.id, isActive: !doc.isActive }),
      });

      if (response.ok) {
        // Firebase listener will auto-update the list
        Swal.fire({
          icon: "success",
          title: doc.isActive ? "Document Hidden" : "Document Published",
          text: doc.isActive
            ? "Document is now hidden from evaluators"
            : "Document is now visible to evaluators",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  const handleSave = async (payload: Partial<HandbookDocument>) => {
    if (!payload.title?.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Title Required",
        text: "Please enter a document title",
        confirmButtonColor: "#A67C37",
      });
      return;
    }

    if (!payload.fileUrl?.trim()) {
      Swal.fire({
        icon: "warning",
        title: "URL Required",
        text: "Please enter a file URL or link",
        confirmButtonColor: "#A67C37",
      });
      return;
    }

    setIsSaving(true);
    try {
      const url = "/api/admin/handbook";
      const method = modalMode === "add" ? "POST" : "PUT";
      const requestBody: Partial<HandbookDocument> =
        modalMode === "add"
          ? payload
          : { id: payload.id || selectedDocument?.id, ...payload };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: modalMode === "add" ? "Document Added!" : "Document Updated!",
          confirmButtonColor: "#A67C37",
        });
        setIsModalOpen(false);
        // Firebase listener will auto-update the list
      } else {
        throw new Error(responseData.error || "Failed to save");
      }
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
        confirmButtonColor: "#A67C37",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const normalizeLink = (url: string) => {
    if (!url) return url;
    return /^https?:\/\//i.test(url) ? url : `https://${url}`;
  };

  const handbookColumns = [
    { name: "Document", uid: "document" },
    { name: "Added", uid: "added" },
    { name: "Status", uid: "status" },
    { name: "Link", uid: "link" },
    { name: "Actions", uid: "actions" },
  ];

  const renderHandbookCell = (item: HandbookDocument, columnKey: React.Key) => {
    switch (columnKey) {
      case "document":
        return (
          <div className="flex items-center gap-3">
            <MdLink className="text-blue-500" size={22} />
            <div>
              <p className="font-medium text-gray-900">{item.title}</p>
              {item.description && (
                <p className="text-sm text-gray-500 line-clamp-1">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        );
      case "link":
        return item.fileUrl ? (
          <a
            href={normalizeLink(item.fileUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-700 text-sm"
          >
            Link
          </a>
        ) : (
          <span className="text-gray-400 italic text-sm">No link</span>
        );
      case "added":
        return (
          <span className="text-sm text-gray-600">
            {formatDate(item.uploadedAt)}
          </span>
        );
      case "status":
        return (
          <button
            onClick={() => handleToggleActive(item)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              item.isActive
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {item.isActive ? "Published" : "Hidden"}
          </button>
        );
      case "actions":
        return undefined;
      default:
        return undefined;
    }
  };

  return (
    <div className="text-black flex flex-col gap-4 lg:gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold uppercase flex items-center gap-2">
            <MdMenuBook size={28} />
            Evaluator Handbook
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Manage documents and guidelines for evaluators
          </p>
        </div>
        <Button
          className="bg-[#A67C37] text-white font-semibold"
          startContent={<MdAdd size={20} />}
          onPress={handleAdd}
        >
          Add Document
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MdSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#A67C37] focus:border-transparent"
          />
        </div>
      </div>

      {/* Documents Table */}
      <AdminTable
        type="handbook"
        isLoading={isLoading}
        columns={handbookColumns}
        data={paginatedDocuments}
        handleEditItem={handleEdit}
        handleDeleteItem={handleDelete}
        renderCell={renderHandbookCell}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination
            showControls
            total={totalPages}
            page={page}
            onChange={setPage}
            classNames={{
              cursor: "bg-[#A67C37] text-white font-bold",
            }}
          />
        </div>
      )}

      {/* Add/Edit Modal */}
      <AdminModal
        type="handbook"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        entity={selectedDocument}
        mode={modalMode}
        isLoading={isSaving}
      />
    </div>
  );
}
