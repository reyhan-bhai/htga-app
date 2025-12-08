"use client";

import { Establishment } from "@/types/restaurant";
import React, { useEffect, useState } from "react";
import { MdClose } from "react-icons/md";

interface RestaurantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (restaurant: Partial<Establishment>) => void;
  restaurant?: Establishment | null;
  mode: "add" | "edit" | "view";
}

export default function RestaurantModal({
  isOpen,
  onClose,
  onSave,
  restaurant,
  mode,
}: RestaurantModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    address: "",
    contact: "",
    status: true,
  });

  useEffect(() => {
    if (restaurant && (mode === "edit" || mode === "view")) {
      setFormData({
        name: restaurant.name || "",
        category: restaurant.category || "",
        address: restaurant.address || "",
        contact: "",
        status: true,
      });
    } else {
      setFormData({
        name: "",
        category: "",
        address: "",
        contact: "",
        status: true,
      });
    }
  }, [restaurant, mode, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode !== "view") {
      onSave({
        id: restaurant?.id,
        name: formData.name,
        category: formData.category,
        address: formData.address,
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  const isViewMode = mode === "view";
  const title =
    mode === "add"
      ? "ADD / EDIT RESTAURANT"
      : mode === "edit"
        ? "ADD / EDIT RESTAURANT"
        : "Lihat Detail Restaurant";

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
          {/* ID Restaurant (view mode only) */}
          {isViewMode && restaurant && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID Restaurant
              </label>
              <input
                type="text"
                value={restaurant.id}
                disabled
                placeholder="2323492"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
              />
            </div>
          )}

          {/* Restaurant Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Restaurant Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={isViewMode}
              placeholder="Type your Restaurant Name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
              required={!isViewMode}
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              disabled={isViewMode}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
              required={!isViewMode}
            >
              <option value="">Select Restaurant City</option>
              <option value="Bakery">Berlin</option>
              <option value="Italy">Tokyo</option>
              <option value="FastFood">Moscow</option>
            </select>
          </div>

          {/* Full Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              disabled={isViewMode}
              placeholder="Select City"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600 resize-none"
            />
          </div>

          {/* Restaurant Contact */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Restaurant Contact
            </label>
            <input
              type="text"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              disabled={isViewMode}
              placeholder="Contact / Website"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
            />
          </div>

          {/* Status Toggle */}
          {isViewMode && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Status
              </label>
              <label className="relative inline-flex items-center cursor-not-allowed opacity-60">
                <input
                  type="checkbox"
                  checked={formData.status}
                  disabled
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
              <span className="text-sm text-gray-600">
                {formData.status ? "Active" : "Inactive"}
              </span>
            </div>
          )}
          {!isViewMode && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Status
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.status}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: e.target.checked,
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
              <span className="text-sm text-gray-600">
                {formData.status ? "Active / Inactive" : "Inactive"}
              </span>
            </div>
          )}

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
