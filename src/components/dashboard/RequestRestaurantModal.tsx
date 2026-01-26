"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";

interface RequestRestaurantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RequestRestaurantFormState) => Promise<void>;
}

interface RequestRestaurantFormState {
  name: string;
  location: string;
  cuisine: string;
  notes: string;
}

const initialFormState: RequestRestaurantFormState = {
  name: "",
  location: "",
  cuisine: "",
  notes: "",
};

export default function RequestRestaurantModal({
  isOpen,
  onClose,
  onSubmit,
}: RequestRestaurantModalProps) {
  const [formState, setFormState] =
    useState<RequestRestaurantFormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormState(initialFormState);
    }
  }, [isOpen]);

  const handleChange =
    (field: keyof RequestRestaurantFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormState((prevState) => ({
        ...prevState,
        [field]: event.target.value,
      }));
    };

  const handleSubmit = async () => {
    if (!formState.name.trim() || !formState.location.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Missing info",
        text: "Please add the restaurant name and location.",
        confirmButtonColor: "#1B1B1B",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formState);
      await Swal.fire({
        icon: "success",
        title: "Recommendation sent",
        text: "Thanks! We’ll review your suggestion soon.",
        confirmButtonColor: "#1B1B1B",
      });
      onClose();
    } catch (error) {
      console.error("[RequestRestaurantModal] Submission failed:", error);
      await Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: "Please try again in a moment.",
        confirmButtonColor: "#1B1B1B",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

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
          <h3 className="text-lg font-bold text-gray-900">
            Recommend a Restaurant
          </h3>
          <p className="text-sm text-gray-500">
            Share a place you think deserves a rating.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="restaurant-name"
              className="text-xs font-semibold uppercase tracking-wide text-gray-400"
            >
              Restaurant Name
            </label>
            <input
              id="restaurant-name"
              value={formState.name}
              onChange={handleChange("name")}
              placeholder="e.g. Cafe Flora"
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 shadow-[0_8px_20px_rgba(15,23,42,0.06)] focus:border-[#FFA200] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="restaurant-location"
              className="text-xs font-semibold uppercase tracking-wide text-gray-400"
            >
              Address
            </label>
            <input
              id="restaurant-location"
              value={formState.location}
              onChange={handleChange("location")}
              placeholder="City, neighborhood, or address"
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 shadow-[0_8px_20px_rgba(15,23,42,0.06)] focus:border-[#FFA200] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="restaurant-cuisine"
              className="text-xs font-semibold uppercase tracking-wide text-gray-400"
            >
              Category
            </label>
            <input
              id="restaurant-cuisine"
              value={formState.cuisine}
              onChange={handleChange("cuisine")}
              placeholder="e.g. Italian, Modern Asian"
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 shadow-[0_8px_20px_rgba(15,23,42,0.06)] focus:border-[#FFA200] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="restaurant-notes"
              className="text-xs font-semibold uppercase tracking-wide text-gray-400"
            >
              Notes (optional)
            </label>
            <textarea
              id="restaurant-notes"
              value={formState.notes}
              onChange={handleChange("notes")}
              placeholder="Anything special we should know?"
              rows={3}
              className="mt-2 w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 shadow-[0_8px_20px_rgba(15,23,42,0.06)] focus:border-[#FFA200] focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="rounded-full bg-[#1B1B1B] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-gray-300/50 transition hover:bg-black"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending..." : "Send Recommendation"}
          </button>
        </div>
      </div>
    </div>
  );
}
