import TableComponent, { renderEvaluatorCell } from "@/components/table/Table";
import { evaluatorColumns, restaurantColumns } from "@/constants/assignedData";

interface AdminTableProps {
  type: "assignment" | "evaluator" | "restaurant";
  isLoading: boolean;

  // Assignment Props
  selectedView?: string;
  evaluatorViewData?: any[];
  restaurantViewData?: any[];
  evaluators?: any[];
  establishments?: any[];
  assignments?: any[];
  setEditingRestaurant?: (restaurant: any) => void;
  setEditEvaluator1?: (id: string) => void;
  setEditEvaluator2?: (id: string) => void;
  setIsEditModalOpen?: (open: boolean) => void;
  handleViewDetails?: (item: any) => void;
  handleEdit?: (
    item: any,
    selectedView: string,
    assignments: any[],
    setEditingRestaurant: (restaurant: any) => void,
    setEditEvaluator1: (id: string) => void,
    setEditEvaluator2: (id: string) => void,
    setIsEditModalOpen: (open: boolean) => void
  ) => void;
  handleSendNDAEmail?: (evaluator: any) => void;
  handleSendNDAReminder?: (evaluator: any) => void;
  handleSendCompletionReminder?: (evaluator: any) => void;

  // Evaluator & Restaurant Props
  data?: any[];
  handleEditItem?: (item: any) => void;
  handleViewItem?: (item: any) => void;
  handleDeleteItem?: (item: any) => void;
  columns?: any[];
}

export default function AdminTable({
  type,
  isLoading,
  // Assignment
  selectedView,
  evaluatorViewData = [],
  restaurantViewData = [],
  evaluators = [],
  assignments = [],
  setEditingRestaurant,
  setEditEvaluator1,
  setEditEvaluator2,
  setIsEditModalOpen,
  handleViewDetails,
  handleEdit,
  handleSendNDAEmail,
  handleSendNDAReminder,
  handleSendCompletionReminder,
  // Evaluator & Restaurant
  data = [],
  handleEditItem,
  handleViewItem,
  handleDeleteItem,
  columns = [],
}: AdminTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg overflow-hidden">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A67C37]"></div>
        </div>
      </div>
    );
  }

  switch (type) {
    case "assignment":
      return (
        <div className="bg-white rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            {selectedView === "evaluator" ? (
              <TableComponent
                columns={evaluatorColumns}
                data={evaluatorViewData}
                onView={handleViewDetails}
                onEdit={(item) =>
                  handleEdit?.(
                    item,
                    selectedView,
                    assignments,
                    setEditingRestaurant!,
                    setEditEvaluator1!,
                    setEditEvaluator2!,
                    setIsEditModalOpen!
                  )
                }
                hideActions={true}
                renderCell={(item, columnKey) =>
                  renderEvaluatorCell(item, columnKey, {
                    onSendNDAEmail: handleSendNDAEmail!,
                    onSendNDAReminder: handleSendNDAReminder!,
                    onSendCompletionReminder: handleSendCompletionReminder!,
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
                  handleEdit?.(
                    item,
                    selectedView!,
                    assignments,
                    setEditingRestaurant!,
                    setEditEvaluator1!,
                    setEditEvaluator2!,
                    setIsEditModalOpen!
                  )
                }
                onView={handleViewDetails}
                emptyMessage={{
                  title: "No restaurants found",
                  description: "Add restaurants in the Restaurants page.",
                }}
              />
            )}
          </div>
        </div>
      );

    case "evaluator":
      return (
        <div className="bg-white rounded-lg">
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
            data={data}
            onEdit={handleEditItem}
            onView={handleViewItem}
            onDelete={handleDeleteItem}
          />
        </div>
      );

    case "restaurant":
      return (
        <div className="bg-white rounded-lg">
          <TableComponent
            columns={columns}
            data={data}
            onEdit={handleEditItem}
            onView={handleViewItem}
            onDelete={handleDeleteItem}
          />
        </div>
      );

    default:
      return null;
  }
}
