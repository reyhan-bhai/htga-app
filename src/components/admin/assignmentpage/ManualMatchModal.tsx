import React from "react";
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
    setSelectedRestaurant: (id: string) => void
  ) => Promise<void>;
}

export default function ManualMatchModal({
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
                    selectedKeys={
                      selectedEvaluator ? [selectedEvaluator] : []
                    }
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
                      <SelectItem
                        key={evaluator.id}
                        textValue={evaluator.name}
                      >
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
                          <span className="text-black">
                            {restaurant.name}
                          </span>
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
                    <strong>Note:</strong> Each restaurant can be assigned up
                    to 2 evaluators. Each evaluator can be assigned multiple
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
                    setSelectedRestaurant
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