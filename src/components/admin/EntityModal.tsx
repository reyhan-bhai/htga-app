"use client";

import React, { useEffect, useState } from "react";
import { MdClose } from "react-icons/md";

export interface FieldConfig {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "textarea" | "select" | "multiselect";
  placeholder?: string;
  required?: boolean;
  options?: string[]; // For select and multiselect
  rows?: number; // For textarea
}

interface EntityModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<T>) => void;
  entity?: T | null;
  mode: "add" | "edit" | "view";
  title: {
    add: string;
    edit: string;
    view: string;
  };
  fields: FieldConfig[];
  idField?: string; // Field name for the ID (e.g., 'id')
}

export default function EntityModal<T extends Record<string, any>>({
  isOpen,
  onClose,
  onSave,
  entity,
  mode,
  title,
  fields,
  idField = "id",
}: EntityModalProps<T>) {
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (entity && (mode === "edit" || mode === "view")) {
      const initialData: Record<string, any> = {};
      fields.forEach((field) => {
        initialData[field.name] =
          entity[field.name] || (field.type === "multiselect" ? [] : "");
      });
      setFormData(initialData);
    } else {
      const initialData: Record<string, any> = {};
      fields.forEach((field) => {
        initialData[field.name] = field.type === "multiselect" ? [] : "";
      });
      setFormData(initialData);
    }
  }, [entity, mode, isOpen, fields]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode !== "view") {
      const saveData: any = { ...formData };
      if (entity && entity[idField]) {
        saveData[idField] = entity[idField];
      }
      onSave(saveData);
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

  const handleMultiSelectToggle = (fieldName: string, value: string) => {
    if (mode === "view") return;

    setFormData((prev) => {
      const currentValues = prev[fieldName] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v: string) => v !== value)
        : [...currentValues, value];
      return { ...prev, [fieldName]: newValues };
    });
  };

  if (!isOpen) return null;

  const isViewMode = mode === "view";
  const modalTitle =
    mode === "add" ? title.add : mode === "edit" ? title.edit : title.view;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#FF6B00] to-[#FFA200] text-white p-4 rounded-t-lg flex items-center justify-between">
          <h2 className="text-lg font-bold">{modalTitle}</h2>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-1 rounded transition"
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]"
        >
          {/* ID Field (view mode only) */}
          {isViewMode && entity && entity[idField] && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID
              </label>
              <input
                type="text"
                value={entity[idField]}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
              />
            </div>
          )}

          {/* Dynamic Fields */}
          {fields.map((field) => {
            if (field.type === "textarea") {
              return (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                  </label>
                  <textarea
                    name={field.name}
                    value={formData[field.name] || ""}
                    onChange={handleChange}
                    disabled={isViewMode}
                    placeholder={field.placeholder}
                    rows={field.rows || 3}
                    required={!isViewMode && field.required}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600 resize-none"
                  />
                </div>
              );
            }

            if (field.type === "select") {
              return (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                  </label>
                  <div className="relative">
                    <select
                      name={field.name}
                      value={formData[field.name] || ""}
                      onChange={handleChange}
                      disabled={isViewMode}
                      required={!isViewMode && field.required}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600 appearance-none"
                    >
                      <option value="">
                        {field.placeholder || `Select ${field.label}`}
                      </option>
                      {field.options?.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            }

            if (field.type === "multiselect") {
              return (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {field.options?.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          handleMultiSelectToggle(field.name, option)
                        }
                        disabled={isViewMode}
                        className={`px-4 py-2 rounded-md border transition ${
                          (formData[field.name] || []).includes(option)
                            ? "bg-gradient-to-r from-[#FF6B00] to-[#FFA200] text-white border-orange-500"
                            : "bg-white text-gray-700 border-gray-300 hover:border-orange-500"
                        } ${
                          isViewMode
                            ? "opacity-60 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }

            // Default: text, email, tel
            return (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  name={field.name}
                  value={formData[field.name] || ""}
                  onChange={handleChange}
                  disabled={isViewMode}
                  placeholder={field.placeholder}
                  required={!isViewMode && field.required}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                />
              </div>
            );
          })}

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
