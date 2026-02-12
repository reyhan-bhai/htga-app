"use client";

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/react";
import React, { useEffect, useMemo, useState } from "react";
import { MdClose, MdKeyboardArrowDown, MdVisibility, MdVisibilityOff } from "react-icons/md";

export interface FieldConfig {
  name: string;
  label: string;
  type: "text" | "email" | "password" | "select";
  placeholder?: string;
  required?: boolean;
  options?: string[];
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
  idField?: string;
  isLoading?: boolean;
}

function EntityModal<T extends Record<string, unknown>>({
  isOpen,
  onClose,
  onSave,
  entity,
  mode,
  title,
  fields,
  idField = "id",
  isLoading = false,
}: EntityModalProps<T>) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (entity && (mode === "edit" || mode === "view")) {
      const initial: Record<string, unknown> = {};
      fields.forEach((f) => {
        initial[f.name] = (entity as Record<string, unknown>)[f.name] ?? "";
      });
      setFormData(initial);
      return;
    }

    const initial: Record<string, unknown> = {};
    fields.forEach((f) => {
      initial[f.name] = "";
    });
    setFormData(initial);
  }, [entity, fields, isOpen, mode]);

  const isViewMode = mode === "view";
  const modalTitle = useMemo(
    () =>
      mode === "add" ? title.add : mode === "edit" ? title.edit : title.view,
    [mode, title.add, title.edit, title.view],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;
    const payload: Record<string, unknown> = { ...formData };
    if (entity && (entity as Record<string, unknown>)[idField]) {
      payload[idField] = (entity as Record<string, unknown>)[idField];
    }
    onSave(payload as Partial<T>);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const renderField = (field: FieldConfig) => {
    const value = String(formData[field.name] ?? "");

    if (field.type === "select") {
      return (
        <div key={field.name} className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
          </label>
          <div className="relative">
            <select
              name={field.name}
              value={value}
              onChange={handleChange}
              disabled={isViewMode}
              required={!isViewMode && field.required}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-600 appearance-none cursor-pointer ${
                value ? "text-gray-900" : "text-gray-500"
              }`}
            >
              <option value="" disabled hidden>
                Select {field.label}
              </option>
              {(field.options ?? []).map((opt) => (
                <option key={opt} value={opt} className="text-gray-900">
                  {opt}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
              <MdKeyboardArrowDown size={20} />
            </span>
          </div>
        </div>
      );
    }

    if (field.type === "password") {
      return (
        <div key={field.name} className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name={field.name}
              value={value}
              onChange={handleChange}
              disabled={isViewMode}
              placeholder={field.placeholder}
              required={!isViewMode && field.required}
              className="w-full pr-10 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-600"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-4 flex items-center text-gray-500 hover:text-gray-700"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={isViewMode ? -1 : 0}
              disabled={isViewMode}
            >
              {showPassword ? (
                <MdVisibilityOff size={18} />
              ) : (
                <MdVisibility size={18} />
              )}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div key={field.name} className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {field.label}
        </label>
        <input
          type={field.type}
          name={field.name}
          value={value}
          onChange={handleChange}
          disabled={isViewMode}
          placeholder={field.placeholder}
          required={!isViewMode && field.required}
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-600"
        />
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isDismissable={!isLoading}
      hideCloseButton
    >
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="bg-gradient-to-r from-blue-600 to-blue-500 text-white flex items-center justify-between">
              <span className="font-bold">{modalTitle}</span>
              <button onClick={close}>
                <MdClose size={20} />
              </button>
            </ModalHeader>
            <form onSubmit={handleSubmit}>
              <ModalBody className="py-5 space-y-4">
                {fields.map(renderField)}
              </ModalBody>
              <ModalFooter>
                {!isViewMode ? (
                  <Button
                    className="bg-blue-600 text-white font-semibold"
                    type="submit"
                    isDisabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Save"}
                  </Button>
                ) : null}
              </ModalFooter>
            </form>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

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
        {(close) => (
          <>
            <ModalHeader className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
              Confirm Delete
            </ModalHeader>
            <ModalBody>
              <p className="text-gray-700">
                Are you sure you want to delete <b>{entityName}</b>?
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={close} isDisabled={isLoading}>
                Cancel
              </Button>
              <Button
                color="danger"
                onPress={() => {
                  onConfirm();
                  close();
                }}
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

export interface SuperadminModalProps<T> {
  type: "admin" | "delete";
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: Partial<T>) => void;
  entity?: T | null;
  mode?: "add" | "edit" | "view";
  entityName?: string;
  onConfirm?: () => void;
  isLoading?: boolean;
}

export default function SuperadminModal<T extends Record<string, unknown>>(
  props: SuperadminModalProps<T>,
) {
  if (props.type === "delete") {
    return (
      <ConfirmDeleteModal
        isOpen={props.isOpen}
        onClose={props.onClose}
        entityName={props.entityName ?? "this item"}
        onConfirm={props.onConfirm ?? (() => {})}
        isLoading={props.isLoading}
      />
    );
  }

  const fields: FieldConfig[] = [
    {
      name: "name",
      label: "Full Name",
      type: "text",
      placeholder: "Admin name",
      required: true,
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      placeholder: "admin@email.com",
      required: true,
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      placeholder: "Set password (required for new admin)",
      required: props.mode === "add",
    },
    {
      name: "role",
      label: "Role",
      type: "select",
      required: true,
      options: ["admin", "superadmin"],
    },
  ];

  return (
    <EntityModal
      isOpen={props.isOpen}
      onClose={props.onClose}
      onSave={props.onSave ?? (() => {})}
      entity={props.entity}
      mode={props.mode ?? "add"}
      fields={fields}
      title={{
        add: "ADD / EDIT ADMIN",
        edit: "ADD / EDIT ADMIN",
        view: "Admin Details",
      }}
      isLoading={props.isLoading}
    />
  );
}
