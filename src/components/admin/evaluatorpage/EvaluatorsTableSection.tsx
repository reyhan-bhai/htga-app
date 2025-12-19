import React from "react";
import TableComponent from "@/components/table/Table";

interface EvaluatorTableSectionProps {
  isLoading: boolean;
  evaluators: any[];
  handleEditEvaluator: (evaluator: any) => void;
  handleViewEvaluator: (evaluator: any) => void;
  handleDeleteEvaluator: (evaluator: any) => void;
}

export default function EvaluatorTableSection({
  isLoading,
  evaluators,
  handleEditEvaluator,
  handleViewEvaluator,
  handleDeleteEvaluator,
}: EvaluatorTableSectionProps) {
  return (
    <div className="bg-white rounded-lg">
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <p className="text-gray-500">Loading evaluators...</p>
        </div>
      ) : (
        <TableComponent
          columns={[
            { name: "ID", uid: "id" },
            { name: "Evaluator Name", uid: "name" },
            { name: "Specialties", uid: "specialties" },
            { name: "Email/Contact", uid: "email" },
            { name: "Phone Number", uid: "phone" },
            { name: "Current Position", uid: "position" },
            { name: "Company/Organization", uid: "company" },
            { name: "Actions", uid: "actions" },
          ]}
          data={evaluators}
          onEdit={handleEditEvaluator}
          onView={handleViewEvaluator}
          onDelete={handleDeleteEvaluator}
        />
      )}
    </div>
  );
}