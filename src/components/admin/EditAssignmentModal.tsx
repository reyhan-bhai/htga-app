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
import { MdClose } from "react-icons/md";

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
    setEditEvaluator2: (id: string) => void
  ) => Promise<void>;
}

export default function EditAssignmentModal({
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
}: EditAssignmentModalProps) {
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
                  Reassign or remove evaluators from this restaurant. Leave a
                  field empty to remove that evaluator. Clear both to delete
                  the assignment entirely.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  <strong>Restaurant Category:</strong>{" "}
                  {editingRestaurant?.category}
                </div>

                {/* Evaluator 1 Selection */}
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-sm text-gray-700">
                    Evaluator 1
                  </label>
                  <Select
                    placeholder="Select evaluator 1 or leave empty"
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
                        e.specialties.includes(editingRestaurant?.category)
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
                  {editEvaluator1 && (
                    <Button
                      size="sm"
                      color="danger"
                      variant="flat"
                      onPress={() => setEditEvaluator1("")}
                      startContent={<MdClose size={16} />}
                    >
                      Remove Evaluator 1
                    </Button>
                  )}
                </div>

                {/* Evaluator 2 Selection */}
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
                            editingRestaurant?.category
                          ) && e.id !== editEvaluator1
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

                {!editEvaluator1 && !editEvaluator2 && (
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
                    setEditEvaluator2
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