"use client";

import { db } from "@/lib/firebase";
import { Button, Pagination, Spinner } from "@nextui-org/react";
import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";
import {
  MdAdd,
  MdClose,
  MdDelete,
  MdEdit,
  MdLink,
  MdMenuBook,
  MdOpenInNew,
  MdSearch,
} from "react-icons/md";
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

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    fileUrl: "",
  });

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
    setFormData({
      title: "",
      description: "",
      fileUrl: "",
    });
    setSelectedDocument(null);
    setModalMode("add");
    setIsModalOpen(true);
  };

  const handleEdit = (doc: HandbookDocument) => {
    setFormData({
      title: doc.title,
      description: doc.description || "",
      fileUrl: doc.fileUrl,
    });
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

  const handleSave = async () => {
    if (!formData.title.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Title Required",
        text: "Please enter a document title",
        confirmButtonColor: "#A67C37",
      });
      return;
    }

    if (!formData.fileUrl.trim()) {
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
      const body =
        modalMode === "add"
          ? formData
          : { id: selectedDocument?.id, ...formData };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: modalMode === "add" ? "Document Added!" : "Document Updated!",
          confirmButtonColor: "#A67C37",
        });
        setIsModalOpen(false);
        // Firebase listener will auto-update the list
      } else {
        throw new Error(data.error || "Failed to save");
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
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner size="lg" color="warning" />
          </div>
        ) : paginatedDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <MdMenuBook size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">No documents found</p>
            <p className="text-sm">Add your first handbook document</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-700">
                    Document
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700 hidden lg:table-cell">
                    Added
                  </th>
                  <th className="text-center p-4 font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-center p-4 font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedDocuments.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <MdLink className="text-blue-500" size={24} />
                        <div>
                          <p className="font-medium text-gray-900">
                            {doc.title}
                          </p>
                          {doc.description && (
                            <p className="text-sm text-gray-500 line-clamp-1">
                              {doc.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden lg:table-cell text-sm text-gray-600">
                      {formatDate(doc.uploadedAt)}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleActive(doc)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          doc.isActive
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {doc.isActive ? "Published" : "Hidden"}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => window.open(doc.fileUrl, "_blank")}
                          className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                          title="Open Link"
                        >
                          <MdOpenInNew size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(doc)}
                          className="p-2 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
                          title="Edit"
                        >
                          <MdEdit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(doc)}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                          title="Delete"
                        >
                          <MdDelete size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">
                {modalMode === "add" ? "Add New Document" : "Edit Document"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <MdClose size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Halal Evaluation Guidelines"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full h-11 px-3 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A67C37] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Brief description of the document..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A67C37] focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File URL / Link <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MdLink
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="https://drive.google.com/..."
                    value={formData.fileUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, fileUrl: e.target.value })
                    }
                    className="w-full h-11 pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A67C37] focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Paste a Google Drive link, Dropbox link, or any accessible URL
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t">
              <Button
                variant="flat"
                className="flex-1"
                onPress={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#A67C37] text-white font-semibold"
                onPress={handleSave}
                isLoading={isSaving}
              >
                {modalMode === "add" ? "Add Document" : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
