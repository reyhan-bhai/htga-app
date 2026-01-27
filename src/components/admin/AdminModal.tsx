"use client";

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
} from "@nextui-org/react";
import React, { useEffect, useMemo, useState } from "react";
import { MdClose } from "react-icons/md";
import AdminSearchableSelect from "./AdminSearchableSelect";

import { db } from "@/lib/firebase";
import { onValue, push, ref, remove, set } from "firebase/database";

// --- EntityModal Implementation ---

export interface FieldConfig {
  name: string;
  label: string;
  type:
    | "text"
    | "email"
    | "tel"
    | "password"
    | "textarea"
    | "select"
    | "multiselect";
  placeholder?: string;
  required?: boolean;
  options?: string[]; // For select and multiselect
  rows?: number; // For textarea
  allowDelete?: boolean; // New: Allow deleting options
  allowAdd?: boolean; // New: Allow adding new options
  rowGroup?: string; // Group ID for rendering in the same row
  className?: string; // Custom width/styles
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
  isLoading?: boolean;
  onDeleteOption?: (fieldName: string, option: string) => void; // New prop
}

function EntityModal<T extends Record<string, any>>({
  isOpen,
  onClose,
  onSave,
  entity,
  mode,
  title,
  fields,
  idField = "id",
  isLoading = false,
  onDeleteOption,
}: EntityModalProps<T>) {
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (entity && (mode === "edit" || mode === "view")) {
      const initialData: Record<string, any> = {};
      fields.forEach((field) => {
        const rawValue = entity[field.name];
        if (field.type === "multiselect") {
          initialData[field.name] = Array.isArray(rawValue) ? rawValue : [];
          return;
        }
        if (field.type === "select" && Array.isArray(rawValue)) {
          initialData[field.name] = rawValue[0] || "";
          return;
        }
        initialData[field.name] = rawValue || "";
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
    >,
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

  const fieldRows = useMemo(() => {
    const rows: (FieldConfig | FieldConfig[])[] = [];
    let currentGroup: FieldConfig[] = [];
    let currentGroupId: string | null = null;

    fields.forEach((field) => {
      if (field.rowGroup) {
        if (currentGroupId === field.rowGroup) {
          currentGroup.push(field);
        } else {
          if (currentGroup.length > 0) {
            rows.push(currentGroup);
          }
          currentGroup = [field];
          currentGroupId = field.rowGroup;
        }
      } else {
        if (currentGroup.length > 0) {
          rows.push(currentGroup);
          currentGroup = [];
          currentGroupId = null;
        }
        rows.push(field);
      }
    });

    if (currentGroup.length > 0) {
      rows.push(currentGroup);
    }

    return rows;
  }, [fields]);

  const renderField = (field: FieldConfig) => {
    const widthClass = field.className || "w-full";

    if (field.type === "textarea") {
      return (
        <div key={field.name} className={widthClass}>
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none disabled:bg-gray-100 disabled:text-gray-600"
          />
        </div>
      );
    }

    if (field.type === "select") {
      return (
        <div key={field.name} className={widthClass}>
          <AdminSearchableSelect
            name={field.name}
            label={field.label}
            value={formData[field.name] || ""}
            onChange={(e: any) => handleChange(e)}
            options={field.options || []}
            placeholder={field.placeholder}
            disabled={isViewMode}
            required={!isViewMode && field.required}
            allowAdd={field.allowAdd !== false}
            onDeleteOption={
              field.allowDelete && onDeleteOption
                ? (opt) => onDeleteOption(field.name, opt)
                : undefined
            }
          />
        </div>
      );
    }

    if (field.type === "multiselect") {
      return (
        <div key={field.name} className={widthClass}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {field.label}
          </label>
          <div className="flex gap-2 flex-wrap">
            {field.options?.map((option) => (
              <div key={option} className="relative group">
                <button
                  type="button"
                  onClick={() => handleMultiSelectToggle(field.name, option)}
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
                {field.allowDelete && onDeleteOption && !isViewMode && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteOption(field.name, option);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                    title="Delete option"
                  >
                    <MdClose size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Default: text, email, tel
    return (
      <div key={field.name} className={widthClass}>
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none disabled:bg-gray-100 disabled:text-gray-600"
        />
      </div>
    );
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
          {fieldRows.map((field) => {
            if (Array.isArray(field)) {
              // Render field group
              return (
                <div key={field[0].rowGroup} className="flex gap-4">
                  {field.map((f) => renderField(f))}
                </div>
              );
            }
            return renderField(field);
          })}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            {!isViewMode ? (
              <>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`flex-1 bg-gradient-to-r from-[#FF6B00] to-[#FFA200] text-white py-2 px-4 rounded-md hover:shadow-lg transition font-medium ${
                    isLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isLoading ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
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

// --- ConfirmDeleteModal Implementation ---

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityName: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

function ConfirmDeleteModal({
  isOpen,
  onClose,
  entityName,
  onConfirm,
  isLoading = false,
}: ConfirmDeleteModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isDismissable={!isLoading}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 text-black">
              Confirm Delete
            </ModalHeader>
            <ModalBody>
              <p className="text-black">
                Are you sure you want to delete{" "}
                <span className="font-bold">{entityName}</span>? This action
                cannot be undone.
              </p>
            </ModalBody>
            <ModalFooter>
              <Button
                color="default"
                variant="light"
                onPress={onClose}
                isDisabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                color="danger"
                onPress={onConfirm}
                isLoading={isLoading}
                isDisabled={isLoading}
              >
                {isLoading ? "Deleting..." : "Delete"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

// --- ManualMatchModal Implementation ---

interface ManualMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEvaluator: string;
  setSelectedEvaluator: (id: string) => void;
  selectedRestaurant: string;
  setSelectedRestaurant: (id: string) => void;
  evaluators: any[];
  establishments: any[];
  assignments: any[];
  setIsLoading: (loading: boolean) => void;
  fetchData: () => Promise<void>;
  handleSaveManualMatch: (
    selectedEvaluator: string,
    selectedRestaurant: string,
    establishments: any[],
    evaluators: any[],
    assignments: any[],
    setIsLoading: (loading: boolean) => void,
    fetchData: () => Promise<void>,
    onClose: () => void,
    setSelectedEvaluator: (id: string) => void,
    setSelectedRestaurant: (id: string) => void,
  ) => Promise<void>;
}

function ManualMatchModal({
  isOpen,
  onClose,
  selectedEvaluator,
  setSelectedEvaluator,
  selectedRestaurant,
  setSelectedRestaurant,
  evaluators,
  establishments,
  assignments,
  setIsLoading,
  fetchData,
  handleSaveManualMatch,
}: ManualMatchModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      className="mx-4"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 text-black uppercase font-bold">
              Manual Assignment
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-6">
                <p className="text-gray-600 text-sm">
                  Manually assign an evaluator to a restaurant. Select the
                  evaluator and restaurant from the dropdowns below.
                </p>

                {/* Evaluator Selection */}
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-sm text-gray-700">
                    Select Evaluator
                  </label>
                  <Select
                    placeholder="Choose an evaluator..."
                    selectedKeys={selectedEvaluator ? [selectedEvaluator] : []}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;
                      setSelectedEvaluator(selected);
                    }}
                    classNames={{
                      trigger: "bg-white border border-gray-300",
                      value: "text-black",
                    }}
                  >
                    {evaluators.map((evaluator) => (
                      <SelectItem key={evaluator.id} textValue={evaluator.name}>
                        <div className="flex flex-col">
                          <span className="text-black">{evaluator.name}</span>
                          <span className="text-xs text-gray-500">
                            {Array.isArray(evaluator.specialties)
                              ? evaluator.specialties.join(", ")
                              : evaluator.specialties || "No specialty"}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                {/* Restaurant Selection */}
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-sm text-gray-700">
                    Select Restaurant
                  </label>
                  <Select
                    placeholder="Choose a restaurant..."
                    selectedKeys={
                      selectedRestaurant ? [selectedRestaurant] : []
                    }
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;
                      setSelectedRestaurant(selected);
                    }}
                    classNames={{
                      trigger: "bg-white border border-gray-300",
                      value: "text-black",
                    }}
                  >
                    {establishments.map((restaurant) => (
                      <SelectItem
                        key={restaurant.id}
                        textValue={restaurant.name}
                      >
                        <div className="flex flex-col">
                          <span className="text-black">{restaurant.name}</span>
                          <span className="text-xs text-gray-500">
                            {restaurant.category}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                {/* Info Box */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> Each restaurant can be assigned up to
                    2 evaluators. Each evaluator can be assigned multiple
                    restaurants.
                  </p>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="default" variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button
                className="bg-[#A67C37] text-white"
                onPress={() =>
                  handleSaveManualMatch(
                    selectedEvaluator,
                    selectedRestaurant,
                    establishments,
                    evaluators,
                    assignments,
                    setIsLoading,
                    fetchData,
                    onClose,
                    setSelectedEvaluator,
                    setSelectedRestaurant,
                  )
                }
                isDisabled={!selectedEvaluator || !selectedRestaurant}
              >
                Assign
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

// --- EditAssignmentModal Implementation ---

interface EditAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingRestaurant: any;
  setEditingRestaurant: (restaurant: any) => void;
  editEvaluator1: string;
  setEditEvaluator1: (id: string) => void;
  editEvaluator2: string;
  setEditEvaluator2: (id: string) => void;
  evaluators: any[];
  assignments: any[];
  establishments: any[];
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  fetchData: () => Promise<void>;
  handleSaveEdit: (
    editingRestaurant: any,
    editEvaluator1: string,
    editEvaluator2: string,
    assignments: any[],
    establishments: any[],
    evaluators: any[],
    setIsLoading: (loading: boolean) => void,
    fetchData: () => Promise<void>,
    onClose: () => void,
    setEditingRestaurant: (restaurant: any) => void,
    setEditEvaluator1: (id: string) => void,
    setEditEvaluator2: (id: string) => void,
  ) => Promise<void>;
  singleEvaluatorMode?: boolean;
  allowRestaurantSelection?: boolean;
}

function EditAssignmentModal({
  isOpen,
  onClose,
  editingRestaurant,
  setEditingRestaurant,
  editEvaluator1,
  setEditEvaluator1,
  editEvaluator2,
  setEditEvaluator2,
  evaluators,
  assignments,
  establishments,
  isLoading,
  setIsLoading,
  fetchData,
  handleSaveEdit,
  singleEvaluatorMode = false,
  allowRestaurantSelection = false,
}: EditAssignmentModalProps) {
  const restaurantOptions = useMemo(() => {
    return establishments.map((establishment) => ({
      id: establishment.id,
      name: establishment.name || "Unknown",
      category: establishment.category || "-",
    }));
  }, [establishments]);

  const selectedEvaluator = useMemo(() => {
    return evaluators.find((evaluator) => evaluator.id === editEvaluator1);
  }, [evaluators, editEvaluator1]);

  const selectedRestaurantKey = editingRestaurant?.res_id
    ? [editingRestaurant.res_id]
    : [];

  const handleRestaurantChange = (keys: "all" | Set<React.Key>) => {
    if (keys === "all") return;
    const selected = Array.from(keys)[0];
    const found = restaurantOptions.find((option) => option.id === selected);
    if (!found) return;
    setEditingRestaurant({
      res_id: found.id,
      name: found.name,
      category: found.category,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setEditingRestaurant(null);
        setEditEvaluator1("");
        setEditEvaluator2("");
      }}
      size="lg"
      className="mx-4"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 text-black uppercase font-bold">
              Edit Assignment - {editingRestaurant?.name}
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-6">
                <p className="text-gray-600 text-sm">
                  {singleEvaluatorMode
                    ? "Update the evaluator assignment for this restaurant."
                    : "Reassign or remove evaluators from this restaurant. Leave a field empty to remove that evaluator. Clear both to delete the assignment entirely."}
                </p>

                {/* Evaluator Selection */}
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-sm text-gray-700">
                    {singleEvaluatorMode ? "Evaluator" : "Evaluator 1"}
                  </label>
                  {singleEvaluatorMode && allowRestaurantSelection ? (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                      {selectedEvaluator?.name || "Unknown evaluator"}
                    </div>
                  ) : (
                    <Select
                      placeholder={
                        singleEvaluatorMode
                          ? "Select evaluator"
                          : "Select evaluator 1 or leave empty"
                      }
                      selectedKeys={editEvaluator1 ? [editEvaluator1] : []}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0];
                        setEditEvaluator1(selected ? String(selected) : "");
                      }}
                      variant="bordered"
                      classNames={{
                        trigger: "bg-white border-gray-300",
                        value: "text-black",
                      }}
                    >
                      {evaluators
                        .filter((e) =>
                          e.specialties.includes(editingRestaurant?.category),
                        )
                        .map((evaluator) => (
                          <SelectItem
                            key={evaluator.id}
                            value={evaluator.id}
                            textValue={evaluator.name}
                            className="text-black"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {evaluator.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {Array.isArray(evaluator.specialties)
                                  ? evaluator.specialties.join(", ")
                                  : evaluator.specialties}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                    </Select>
                  )}
                  {editEvaluator1 &&
                    !(singleEvaluatorMode && allowRestaurantSelection) && (
                      <Button
                        size="sm"
                        color="danger"
                        variant="flat"
                        onPress={() => setEditEvaluator1("")}
                        startContent={<MdClose size={16} />}
                      >
                        {singleEvaluatorMode
                          ? "Remove Evaluator"
                          : "Remove Evaluator 1"}
                      </Button>
                    )}
                </div>

                {allowRestaurantSelection ? (
                  <div className="flex flex-col gap-2">
                    <label className="font-semibold text-sm text-gray-700">
                      Restaurant
                    </label>
                    <Select
                      placeholder="Select restaurant"
                      selectedKeys={selectedRestaurantKey}
                      onSelectionChange={handleRestaurantChange}
                      variant="bordered"
                      classNames={{
                        trigger: "bg-white border-gray-300",
                        value: "text-black",
                      }}
                    >
                      {restaurantOptions.map((option) => (
                        <SelectItem
                          key={option.id}
                          value={option.id}
                          textValue={option.name}
                          className="text-black"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{option.name}</span>
                            <span className="text-xs text-gray-500">
                              {option.category}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                    <strong>Restaurant Category:</strong>{" "}
                    {editingRestaurant?.category}
                  </div>
                )}

                {!singleEvaluatorMode && (
                  <div className="flex flex-col gap-2">
                    <label className="font-semibold text-sm text-gray-700">
                      Evaluator 2
                    </label>
                    <Select
                      placeholder="Select evaluator 2 or leave empty"
                      selectedKeys={editEvaluator2 ? [editEvaluator2] : []}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0];
                        setEditEvaluator2(selected ? String(selected) : "");
                      }}
                      variant="bordered"
                      classNames={{
                        trigger: "bg-white border-gray-300",
                        value: "text-black",
                      }}
                    >
                      {evaluators
                        .filter(
                          (e) =>
                            e.specialties.includes(
                              editingRestaurant?.category,
                            ) && e.id !== editEvaluator1,
                        )
                        .map((evaluator) => (
                          <SelectItem
                            key={evaluator.id}
                            value={evaluator.id}
                            textValue={evaluator.name}
                            className="text-black"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {evaluator.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {Array.isArray(evaluator.specialties)
                                  ? evaluator.specialties.join(", ")
                                  : evaluator.specialties}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                    </Select>
                    {editEvaluator2 && (
                      <Button
                        size="sm"
                        color="danger"
                        variant="flat"
                        onPress={() => setEditEvaluator2("")}
                        startContent={<MdClose size={16} />}
                      >
                        Remove Evaluator 2
                      </Button>
                    )}
                  </div>
                )}

                {!singleEvaluatorMode && !editEvaluator1 && !editEvaluator2 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                    ⚠️ Both evaluators are empty. This will delete the entire
                    assignment.
                  </div>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="default" variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button
                className="bg-[#A67C37] text-white"
                onPress={() =>
                  handleSaveEdit(
                    editingRestaurant,
                    editEvaluator1,
                    editEvaluator2,
                    assignments,
                    establishments,
                    evaluators,
                    setIsLoading,
                    fetchData,
                    onClose,
                    setEditingRestaurant,
                    setEditEvaluator1,
                    setEditEvaluator2,
                  )
                }
                isLoading={isLoading}
              >
                {!editEvaluator1 && !editEvaluator2
                  ? "Delete Assignment"
                  : "Update Assignment"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

// Evaluator field configuration
const baseEvaluatorFields: FieldConfig[] = [
  {
    name: "name",
    label: "Evaluator Name",
    type: "text",
    placeholder: "Type evaluator name...",
    required: true,
  },
  {
    name: "email",
    label: "Email/Contact",
    type: "email",
    placeholder: "evaluator@email.com",
    required: true,
  },
  {
    name: "phone",
    label: "Phone Number",
    type: "tel",
    placeholder: "+62xxx...",
  },
  {
    name: "city",
    label: "City",
    type: "text",
    placeholder: "e.g. Kuala Lumpur, Jakarta",
  },
  {
    name: "position",
    label: "Current Position",
    type: "text",
    placeholder: "e.g., Chef Manager, Food Inspector",
  },
  {
    name: "company",
    label: "Company/Organization",
    type: "text",
    placeholder: "Organization name",
  },
  {
    name: "specialties",
    label: "Specialties",
    type: "select",
    placeholder: "Select specialty",
  },
];

// Restaurant field configuration
const baseRestaurantFields: FieldConfig[] = [
  {
    name: "name",
    label: "Restaurant Name",
    type: "text",
    placeholder: "Type your Restaurant Name...",
    required: true,
  },
  {
    name: "category",
    label: "Category",
    type: "select",
    placeholder: "e.g., Bakery, FastFood, Italian",
    required: true,
  },
  {
    name: "address",
    label: "Full Address",
    type: "textarea",
    placeholder: "Enter full address...",
    rows: 3,
  },
  {
    name: "contactInfo",
    label: "Restaurant Contact",
    type: "text",
    placeholder: "Contact / Website",
  },
  {
    name: "rating",
    label: "Rating",
    type: "text",
    placeholder: "e.g., 4.7",
  },
  {
    name: "currency",
    label: "Currency",
    type: "select",
    placeholder: "Select",
    options: ["MYR", "USD", "SGD", "IDR"],
    rowGroup: "budget",
    className: "w-32 flex-none",
    allowAdd: false,
  },
  {
    name: "budget",
    label: "Budget",
    type: "text",
    placeholder: "e.g., 50",
    rowGroup: "budget",
    className: "flex-1",
  },
  {
    name: "halalStatus",
    label: "Halal Status",
    type: "select",
    placeholder: "Select Halal Status",
  },
  {
    name: "remarks",
    label: "Remarks",
    type: "textarea",
    placeholder: "Additional notes or source links...",
    rows: 2,
  },
];

interface AdminModalProps {
  type: "assignment" | "evaluator" | "restaurant" | "delete";
  subtype?: "manual-match" | "edit"; // For assignment
  isOpen: boolean;
  onClose: () => void;
  // EntityModal props
  onSave?: (data: any) => void;
  entity?: any;
  mode?: "add" | "edit" | "view";
  // Delete props
  entityName?: string;
  onConfirm?: () => void;
  // Loading state
  isLoading?: boolean;
  // Assignment props (passed through)
  [key: string]: any;
}

export default function AdminModal(props: AdminModalProps) {
  const { type, subtype, isLoading, ...rest } = props;

  // States for dynamic dropdowns
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<string, string[]>>({}); // value -> keys[]
  const [halalStatuses, setHalalStatuses] = useState<string[]>([]);
  const [halalStatusMap, setHalalStatusMap] = useState<
    Record<string, string[]>
  >({}); // value -> keys[]

  // Delete Option State
  const [deleteOptionState, setDeleteOptionState] = useState<{
    isOpen: boolean;
    type: "category" | "halalStatus" | null;
    value: string;
  }>({ isOpen: false, type: null, value: "" });
  const [isDeletingOption, setIsDeletingOption] = useState(false);

  // Fetch dropdown data for restaurants
  useEffect(() => {
    if (type !== "restaurant" && type !== "evaluator") return;

    // Fetch Categories
    const categoryRef = ref(db, "dropdown/category");
    const unsubscribeCategory = onValue(categoryRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const map: Record<string, string[]> = {};
        const list: string[] = [];

        Object.entries(val).forEach(([key, value]) => {
          const strValue = String(value);
          list.push(strValue);
          if (!map[strValue]) {
            map[strValue] = [];
          }
          map[strValue].push(key);
        });

        setCategoryMap(map);
        setCategories(Array.from(new Set(list)).sort());
      } else {
        setCategories([]);
        setCategoryMap({});
      }
    });

    return () => {
      unsubscribeCategory();
    };
  }, [type]);

  useEffect(() => {
    if (type !== "restaurant") return;

    // Fetch Halal Statuses
    const halalRef = ref(db, "dropdown/halalstatus");
    const unsubscribeHalal = onValue(halalRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const map: Record<string, string[]> = {};
        const list: string[] = [];

        Object.entries(val).forEach(([key, value]) => {
          const strValue = String(value);
          list.push(strValue);
          if (!map[strValue]) {
            map[strValue] = [];
          }
          map[strValue].push(key);
        });

        setHalalStatusMap(map);
        setHalalStatuses(Array.from(new Set(list)).sort());
      } else {
        setHalalStatuses([]);
        setHalalStatusMap({});
      }
    });

    return () => {
      unsubscribeHalal();
    };
  }, [type]);

  const evaluatorFields = useMemo(() => {
    return baseEvaluatorFields.map((field) => {
      if (field.name === "specialties") {
        return {
          ...field,
          options: categories,
          allowDelete: true,
        };
      }
      return field;
    });
  }, [categories]);

  // Construct restaurant fields with dynamic options
  const restaurantFields = useMemo(() => {
    return baseRestaurantFields.map((field) => {
      if (field.name === "category") {
        return {
          ...field,
          options: categories,
          allowDelete: true,
        };
      }
      if (field.name === "halalStatus") {
        return {
          ...field,
          options: halalStatuses,
          allowDelete: true,
        };
      }
      return field;
    });
  }, [categories, halalStatuses]);

  const handleOpenDeleteOption = (fieldName: string, option: string) => {
    let type: "category" | "halalStatus" | null = null;
    if (fieldName === "category" || fieldName === "specialties")
      type = "category";
    if (fieldName === "halalStatus") type = "halalStatus";

    if (type) {
      setDeleteOptionState({ isOpen: true, type, value: option });
    }
  };

  const handleConfirmDeleteOption = async () => {
    const { type, value } = deleteOptionState;
    if (!type || !value) return;

    setIsDeletingOption(true);
    try {
      const dbPath =
        type === "category" ? "dropdown/category" : "dropdown/halalstatus";
      const map = type === "category" ? categoryMap : halalStatusMap;
      const keys = map[value] || [];

      // Delete all instances of this value
      await Promise.all(keys.map((key) => remove(ref(db, `${dbPath}/${key}`))));

      // Close modal
      setDeleteOptionState({ isOpen: false, type: null, value: "" });
    } catch (error) {
      console.error("Error deleting option:", error);
      alert("Failed to delete option. Please try again.");
    } finally {
      setIsDeletingOption(false);
    }
  };

  // Handle save logic for restaurant to persist new dropdown items
  const handleRestaurantSave = async (data: any) => {
    const { category, halalStatus } = data;

    if (category && !categories.includes(category)) {
      try {
        const categoryRef = ref(db, "dropdown/category");
        await set(push(categoryRef), category);
      } catch (error) {
        console.error("Error saving new category:", error);
      }
    }

    if (halalStatus && !halalStatuses.includes(halalStatus)) {
      try {
        const halalRef = ref(db, "dropdown/halalstatus");
        await set(push(halalRef), halalStatus);
      } catch (error) {
        console.error("Error saving new halal status:", error);
      }
    }

    // Call original onSave
    if (props.onSave) {
      props.onSave(data);
    }
  };

  if (type === "delete") {
    return (
      <ConfirmDeleteModal
        isOpen={props.isOpen}
        onClose={props.onClose}
        entityName={props.entityName || ""}
        onConfirm={props.onConfirm || (() => {})}
        isLoading={isLoading}
      />
    );
  }

  if (type === "evaluator") {
    return (
      <>
        <EntityModal
          isOpen={props.isOpen}
          onClose={props.onClose}
          onSave={props.onSave!}
          entity={props.entity}
          mode={props.mode!}
          fields={evaluatorFields}
          title={{
            add: "ADD / EDIT EVALUATOR",
            edit: "ADD / EDIT EVALUATOR",
            view: "Detail Evaluator",
          }}
          isLoading={isLoading}
          onDeleteOption={handleOpenDeleteOption}
        />
        <ConfirmDeleteModal
          isOpen={deleteOptionState.isOpen}
          onClose={() =>
            setDeleteOptionState({ ...deleteOptionState, isOpen: false })
          }
          entityName={`option "${deleteOptionState.value}"`}
          onConfirm={handleConfirmDeleteOption}
          isLoading={isDeletingOption}
        />
      </>
    );
  }

  if (type === "restaurant") {
    return (
      <>
        <EntityModal
          isOpen={props.isOpen}
          onClose={props.onClose}
          onSave={handleRestaurantSave}
          entity={props.entity}
          mode={props.mode!}
          fields={restaurantFields}
          title={{
            add: "ADD / EDIT RESTAURANT",
            edit: "ADD / EDIT RESTAURANT",
            view: "Detail Restaurant",
          }}
          isLoading={isLoading}
          onDeleteOption={handleOpenDeleteOption}
        />
        <ConfirmDeleteModal
          isOpen={deleteOptionState.isOpen}
          onClose={() =>
            setDeleteOptionState({ ...deleteOptionState, isOpen: false })
          }
          entityName={`option "${deleteOptionState.value}"`}
          onConfirm={handleConfirmDeleteOption}
          isLoading={isDeletingOption}
        />
      </>
    );
  }

  if (type === "assignment") {
    if (subtype === "manual-match") {
      return (
        <ManualMatchModal
          {...(rest as any)}
          isOpen={props.isOpen}
          onClose={props.onClose}
        />
      );
    }
    if (subtype === "edit") {
      return (
        <EditAssignmentModal
          {...(rest as any)}
          isOpen={props.isOpen}
          onClose={props.onClose}
        />
      );
    }
  }

  return null;
}
