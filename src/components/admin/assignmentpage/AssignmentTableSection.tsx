import React from "react";
import TableComponent from "@/components/table/Table";
import { renderEvaluatorCell, renderRestaurantCell } from "@/components/table/Table";
import { evaluatorColumns, restaurantColumns } from "@/constants/assignedData";

interface AssignmentTableSectionProps {
  selectedView: string;
  isLoading: boolean;
  evaluatorViewData: any[];
  restaurantViewData: any[];
  evaluators: any[];
  establishments: any[];
  assignments: any[];
  setEditingRestaurant: (restaurant: any) => void;
  setEditEvaluator1: (id: string) => void;
  setEditEvaluator2: (id: string) => void;
  setIsEditModalOpen: (open: boolean) => void;
  handleViewDetails: (item: any) => void;
  handleEdit: (
    item: any,
    selectedView: string,
    assignments: any[],
    setEditingRestaurant: (restaurant: any) => void,
    setEditEvaluator1: (id: string) => void,
    setEditEvaluator2: (id: string) => void,
    setIsEditModalOpen: (open: boolean) => void
  ) => void;
  handleSendNDAEmail: (evaluator: any) => void;
  handleSendNDAReminder: (evaluator: any) => void;
  handleSendCompletionReminder: (evaluator: any) => void;
}

export default function AssignmentTableSection({
  selectedView,
  isLoading,
  evaluatorViewData,
  restaurantViewData,
  evaluators,
  establishments,
  assignments,
  setEditingRestaurant,
  setEditEvaluator1,
  setEditEvaluator2,
  setIsEditModalOpen,
  handleViewDetails,
  handleEdit,
  handleSendNDAEmail,
  handleSendNDAReminder,
  handleSendCompletionReminder,
}: AssignmentTableSectionProps){
    return (
        <>
              <div className="bg-white rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A67C37]"></div>
                    </div>
                  ) : selectedView === "evaluator" ? (
                    <TableComponent
                      columns={evaluatorColumns}
                      data={evaluatorViewData}
                      onView={handleViewDetails}
                      onEdit={(item) =>
                        handleEdit(
                          item,
                          selectedView,
                          assignments,
                          setEditingRestaurant,
                          setEditEvaluator1,
                          setEditEvaluator2,
                          setIsEditModalOpen
                        )
                      }
                      hideActions={true}
                      renderCell={(item, columnKey) =>
                        renderEvaluatorCell(item, columnKey, {
                          onSendNDAEmail: handleSendNDAEmail,
                          onSendNDAReminder: handleSendNDAReminder,
                          onSendCompletionReminder: handleSendCompletionReminder,
                        })
                      }
                      emptyMessage={{
                        title:
                          evaluators.length === 0
                            ? "No evaluators yet"
                            : "No assignments yet",
                        description:
                          evaluators.length === 0
                            ? "Add evaluators first in the Evaluators page."
                            : "Click 'Match Evaluator' to start assigning evaluators to restaurants.",
                      }}
                    />
                  ) : (
                    <TableComponent
                      columns={restaurantColumns}
                      data={restaurantViewData}
                      onEdit={(item) =>
                        handleEdit(
                          item,
                          selectedView,
                          assignments,
                          setEditingRestaurant,
                          setEditEvaluator1,
                          setEditEvaluator2,
                          setIsEditModalOpen
                        )
                      }
                      hideActions={false}
                      renderCell={(item, columnKey) => {
                        // Let default handler manage actions
                        if (columnKey === "actions") {
                          return undefined;
                        }
                        return renderRestaurantCell(item, columnKey);
                      }}
                      emptyMessage={{
                        title:
                          establishments.length === 0
                            ? "No restaurants yet"
                            : "No assignments yet",
                        description:
                          establishments.length === 0
                            ? "Add restaurants first in the Restaurants page."
                            : "Click 'Match Evaluator' to start assigning restaurants to evaluators.",
                      }}
                    />
                  )}
                </div>
              </div>
        
        </>
    )
}