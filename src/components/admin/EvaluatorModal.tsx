"use client";

import { Evaluator } from "@/types/restaurant";
import React, { useEffect, useState } from "react";
import { MdClose } from "react-icons/md";

interface EvaluatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (evaluator: Partial<Evaluator>) => void;
  evaluator?: Evaluator | null;
  mode: "add" | "edit" | "view";
}

export default function EvaluatorModal({
  isOpen,
  onClose,
  onSave,
  evaluator,
  mode,
}: EvaluatorModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    currentPosition: "",
    company: "",
    specialties: [] as string[],
  });

  useEffect(() => {
    if (evaluator && (mode === "edit" || mode === "view")) {
      setFormData({
        name: evaluator.name || "",
        email: "",
        phone: "",
        currentPosition: "",
        company: "",
        specialties: evaluator.specialties || [],
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        currentPosition: "",
        company: "",
        specialties: [],
      });
    }
  }, [evaluator, mode, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode !== "view") {
      onSave({
        id: evaluator?.id,
        name: formData.name,
        specialties: formData.specialties,
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSpecialtyToggle = (specialty: string) => {
    if (mode === "view") return;

    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter((s) => s !== specialty)
        : [...prev.specialties, specialty],
    }));
  };

  if (!isOpen) return null;

  const isViewMode = mode === "view";
  const title =
    mode === "add"
      ? "ADD / EDIT EVALUATOR"
      : mode === "edit"
        ? "ADD / EDIT EVALUATOR"
        : "Lihat Detail Evaluator";

  const availableSpecialties = ["Bakery", "Italy", "FastFood"];

  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#FF6B00] to-[#FFA200] text-white p-4 rounded-t-lg flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-1 rounded transition"
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* ID Evaluator (view mode only) */}
          {isViewMode && evaluator && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID Evaluator
              </label>
              <input
                type="text"
                value={evaluator.id}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
              />
            </div>
          )}

          {/* Evaluator Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Evaluator
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={isViewMode}
              placeholder="Type evaluator name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
              required={!isViewMode}
            />
          </div>

          {/* Email/Contact */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email/Contact
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isViewMode}
              placeholder="evaluator@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={isViewMode}
              placeholder="+62xxx..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
            />
          </div>

          {/* Current Position */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Position
            </label>
            <input
              type="text"
              name="currentPosition"
              value={formData.currentPosition}
              onChange={handleChange}
              disabled={isViewMode}
              placeholder="e.g., Chef Manager, Food Inspector"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
            />
          </div>

          {/* Company/Organization */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company/Organization
            </label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              disabled={isViewMode}
              placeholder="Organization name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
            />
          </div>

          {/* Specialties */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aksi (Specialties)
            </label>
            <div className="flex gap-2">
              {availableSpecialties.map((specialty) => (
                <button
                  key={specialty}
                  type="button"
                  onClick={() => handleSpecialtyToggle(specialty)}
                  disabled={isViewMode}
                  className={`px-4 py-2 rounded-md border transition ${
                    formData.specialties.includes(specialty)
                      ? "bg-gradient-to-r from-[#FF6B00] to-[#FFA200] text-white border-orange-500"
                      : "bg-white text-gray-700 border-gray-300 hover:border-orange-500"
                  } ${isViewMode ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {specialty}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            {!isViewMode ? (
              <>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#FF6B00] to-[#FFA200] text-white py-2 px-4 rounded-md hover:shadow-lg transition font-medium"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition font-medium"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition font-medium"
              >
                Close
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
