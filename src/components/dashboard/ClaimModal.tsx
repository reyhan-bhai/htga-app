import { EvaluatorAssignment } from "@/lib/assignmentService";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";

interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: EvaluatorAssignment | null;
  userId: string;
}

export default function ClaimModal({
  isOpen,
  onClose,
  assignment,
  userId,
}: ClaimModalProps) {
  const [claimAmount, setClaimAmount] = useState("");
  const [claimCurrency, setClaimCurrency] = useState("MYR");
  const [claimFile, setClaimFile] = useState<File | null>(null);
  const [claimPreviewUrl, setClaimPreviewUrl] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSubmitting, setClaimSubmitting] = useState(false);

  const claimCameraInputRef = useRef<HTMLInputElement | null>(null);
  const claimFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!claimFile) {
      setClaimPreviewUrl(null);
      return;
    }
    const previewUrl = URL.createObjectURL(claimFile);
    setClaimPreviewUrl(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [claimFile]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setClaimAmount("");
      setClaimCurrency("MYR");
      setClaimFile(null);
      setClaimError(null);
    }
  }, [isOpen]);

  const handleClaimSubmit = async () => {
    if (!userId || !assignment) return;

    setClaimError(null);

    if (!claimFile) {
      setClaimError("Please capture or upload a receipt image.");
      return;
    }

    const amount = Number.parseFloat(claimAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      setClaimError("Please enter a valid amount spent.");
      return;
    }

    setClaimSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("assignmentId", assignment.id);
      formData.append("evaluatorId", userId);
      formData.append("amountSpent", amount.toString());
      formData.append("currency", claimCurrency);
      formData.append("receipt", claimFile);

      const response = await fetch("/api/user/claim-submission", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Failed to submit claim.");
      }

      onClose();

      await Swal.fire({
        icon: "success",
        title: "Claim submitted",
        text: "Your receipt and amount have been sent to admin.",
        confirmButtonColor: "#1B1B1B",
      });
    } catch (error) {
      console.error("[Dashboard] Claim submission failed:", error);
      await Swal.fire({
        icon: "error",
        title: "Submission failed",
        text: "Please try again in a moment.",
        confirmButtonColor: "#1B1B1B",
      });
    } finally {
      setClaimSubmitting(false);
    }
  };

  if (!isOpen || !assignment) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900">Claim Submission</h3>
          <p className="text-sm text-gray-500">
            {assignment.establishment.name}
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col">
            <label
              htmlFor="claim-receipt"
              className="text-xs font-semibold uppercase tracking-wide text-gray-400"
            >
              Receipt Image
            </label>

            {/* Hidden Inputs */}
            <input
              id="claim-receipt"
              ref={claimCameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(event) =>
                setClaimFile(event.target.files?.[0] || null)
              }
              className="hidden"
            />
            <input
              id="claim-receipt-file"
              ref={claimFileInputRef}
              type="file"
              accept="image/*"
              onChange={(event) =>
                setClaimFile(event.target.files?.[0] || null)
              }
              className="hidden"
            />

            <div className="mt-2 flex flex-row gap-3">
              <button
                type="button"
                onClick={() => claimCameraInputRef.current?.click()}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 shadow-[0_8px_20px_rgba(15,23,42,0.06)] transition hover:border-[#FFA200]"
              >
                <span className="text-base">📷</span>
                Camera
              </button>
              <button
                type="button"
                onClick={() => claimFileInputRef.current?.click()}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 shadow-[0_8px_20px_rgba(15,23,42,0.06)] transition hover:border-[#1B1B1B]"
              >
                <span className="text-base">🗂️</span>
                File
              </button>
            </div>

            {claimPreviewUrl && (
              <Image
                src={claimPreviewUrl}
                alt="Receipt preview"
                width={400}
                height={160}
                className="mt-3 h-40 w-full rounded-2xl object-cover"
              />
            )}
          </div>
          <div>
            <label
              htmlFor="claim-amount"
              className="text-xs font-semibold uppercase tracking-wide text-gray-400"
            >
              Amount Spent
            </label>
            <div className="mt-2 flex gap-3">
              <div className="relative">
                <select
                  value={claimCurrency}
                  onChange={(e) => setClaimCurrency(e.target.value)}
                  className="appearance-none rounded-2xl border border-gray-200 bg-white px-4 py-3 pr-10 text-sm font-semibold text-gray-800 shadow-[0_8px_20px_rgba(15,23,42,0.06)] focus:border-[#FFA200] focus:outline-none"
                >
                  {["MYR", "USD", "SGD", "IDR"].map((curr) => (
                    <option
                      key={curr}
                      value={curr}
                      className="text-sm font-semibold text-gray-800"
                    >
                      {curr}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                  ▾
                </span>
              </div>
              <input
                id="claim-amount"
                type="number"
                min={0}
                step="0.01"
                value={claimAmount}
                onChange={(event) => setClaimAmount(event.target.value)}
                placeholder="e.g. 25.50"
                className="w-full flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 shadow-[0_8px_20px_rgba(15,23,42,0.06)] focus:border-[#FFA200] focus:outline-none"
              />
            </div>
          </div>

          {claimError && (
            <p className="text-sm font-semibold text-red-600">{claimError}</p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600"
            disabled={claimSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleClaimSubmit}
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
            disabled={claimSubmitting}
          >
            {claimSubmitting ? "Submitting..." : "Submit Claim"}
          </button>
        </div>
      </div>
    </div>
  );
}