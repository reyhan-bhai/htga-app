"use client";

import EvaluatorModal from "@/components/admin/EvaluatorModal";
import { Evaluator } from "@/types/restaurant";
import { useState } from "react";

export default function EvaluatorsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvaluator, setSelectedEvaluator] = useState<Evaluator | null>(
    null
  );
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");

  const handleAddEvaluator = () => {
    setSelectedEvaluator(null);
    setModalMode("add");
    setIsModalOpen(true);
  };

  const handleViewEvaluator = (evaluator: Evaluator) => {
    setSelectedEvaluator(evaluator);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleSaveEvaluator = async (evaluator: Partial<Evaluator>) => {
    try {
      // TODO: Implement API call to save evaluator
      console.log("Saving evaluator:", evaluator);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving evaluator:", error);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Evaluator Management</h2>
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleAddEvaluator}
          className="bg-gradient-to-r from-[#FF6B00] to-[#FFA200] text-white px-4 py-2 rounded-md hover:shadow-lg transition"
        >
          + Add New Evaluator
        </button>
        <button
          onClick={() =>
            handleViewEvaluator({
              id: "09989",
              name: "Fajar Romadoni",
              specialties: ["Bakery", "Italy"],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
          }
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:shadow-lg transition"
        >
          View Detail Evaluator
        </button>
      </div>

      <EvaluatorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEvaluator}
        evaluator={selectedEvaluator}
        mode={modalMode}
      />
    </div>
  );
}
