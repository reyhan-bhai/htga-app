"use client";

import EditAssignmentModal from "./assignmentpage/EditAssignmentModal";
import ManualMatchModal from "./assignmentpage/ManualMatchModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import EntityModal, { FieldConfig } from "./EntityModal";

// Evaluator field configuration
const evaluatorFields: FieldConfig[] = [
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
    type: "text",
    placeholder: "e.g., Bakery, Italian, Fast Food",
  },
];

// Restaurant field configuration
const restaurantFields: FieldConfig[] = [
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
    type: "text",
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
    name: "budget",
    label: "Budget (MYR)",
    type: "text",
    placeholder: "e.g., 50",
  },
  {
    name: "halalStatus",
    label: "Halal Status",
    type: "select",
    placeholder: "Select Halal Status",
    options: ["Muslim-Owned", "Muslim-friendly", "Halal Certified by JAKIM"],
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
  // Assignment props (passed through)
  [key: string]: any;
}

export default function AdminModal(props: AdminModalProps) {
  const { type, subtype, ...rest } = props;

  if (type === "delete") {
    return (
      <ConfirmDeleteModal
        isOpen={props.isOpen}
        onClose={props.onClose}
        entityName={props.entityName || ""}
        onConfirm={props.onConfirm || (() => {})}
      />
    );
  }

  if (type === "evaluator") {
    return (
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
      />
    );
  }

  if (type === "restaurant") {
    return (
      <EntityModal
        isOpen={props.isOpen}
        onClose={props.onClose}
        onSave={props.onSave!}
        entity={props.entity}
        mode={props.mode!}
        fields={restaurantFields}
        title={{
          add: "ADD / EDIT RESTAURANT",
          edit: "ADD / EDIT RESTAURANT",
          view: "Detail Restaurant",
        }}
      />
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
