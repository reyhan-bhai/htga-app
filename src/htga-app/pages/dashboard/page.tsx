"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { dummyEstablishments } from "../../data/dummyData";
import { AiOutlinePlus, AiOutlineBell, AiOutlineFilter } from "react-icons/ai";

type CategoryFilter = "All" | "Concept" | "Ethnic" | "Specialty";

export default function DashboardPage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("All");
  const router = useRouter();
  const { user } = useAuth();

  const handleAddRestaurant = () => {
    router.push("/htga/restaurants");
  };

  const handleProfile = () => {
    router.push("/htga/profile");
  };

  // Filter establishments based on selected category
  const filteredEstablishments = dummyEstablishments.filter((est) => {
    if (selectedCategory === "All") return true;
    return est.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  // Calculate progress
  const completedCount = filteredEstablishments.filter(
    (est) => est.evaluators[0]?.status === "Completed"
  ).length;
  const totalCount = filteredEstablishments.length;

  // Get evaluation tasks with status
  const evaluationTasks = filteredEstablishments.map((est) => ({
    ...est,
    evaluatorStatus: est.evaluators[0]?.status || "Start",
    dueDate: est.dateAssigned,
  }));

  // Count due evaluations (example: evaluations not completed in last 2 days)
  const dueCount = evaluationTasks.filter(
    (task) => task.evaluatorStatus !== "Completed"
  ).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-500";
      case "Continue":
        return "bg-[#FFA200]";
      case "Start":
        return "bg-[#D62C2C]";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Completed":
        return "badge-complete";
      case "Continue":
        return "badge-continue";
      case "Start":
        return "badge-start";
      default:
        return "bg-gray-400 text-white";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Header */}
      <div className="bg-cream pt-12 pb-4 px-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-[#1B1B1B]">Good Morning,</h2>
            <h2 className="text-2xl font-bold text-[#1B1B1B]">
              {user?.name || "Evaluator Name"}!
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative">
              <AiOutlineBell className="text-2xl text-[#1B1B1B]" />
            </button>
            <button onClick={handleProfile}>
              <div className="w-10 h-10 rounded-full bg-gradient-2 flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0) || "E"}
              </div>
            </button>
          </div>
        </div>

        {/* Add New Restaurant Button */}
        <button
          onClick={handleAddRestaurant}
          className="w-full bg-[#1B1B1B] hover:bg-[#2B2B2B] text-white font-semibold py-3 rounded-full flex items-center justify-center gap-2 mb-6 htga-button"
        >
          <AiOutlinePlus className="text-xl" />
          <span>Add New Restaurant</span>
        </button>

        {/* Category Filters */}
        <div className="mb-4">
          <h3 className="text-sm font-bold text-[#1B1B1B] mb-3">
            Evaluation Category
          </h3>
          <div className="flex gap-2 flex-wrap">
            {(["All", "Concept", "Ethnic", "Specialty"] as CategoryFilter[]).map(
              (category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-2 rounded-full font-medium text-sm transition-all ${
                    selectedCategory === category
                      ? "bg-[#FFA200] text-white"
                      : "bg-[#F4F4F4] text-[#1B1B1B] hover:bg-[#E5E5E5]"
                  }`}
                >
                  {category}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6">
        {/* Evaluation Progress Card */}
        <div className="htga-card p-5 mb-4 border-2 border-[#FFA200]">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-sm font-bold text-[#1B1B1B] mb-1">
                Evaluation Progress
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-[#1B1B1B]">
                  {completedCount}
                </span>
                <span className="text-sm text-[#939393]">
                  from {totalCount} restaurant list
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-[#939393]">
                {completedCount}/{totalCount}
              </span>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-[#F4F4F4] rounded-full h-2">
            <div
              className="bg-[#FFA200] h-2 rounded-full transition-all"
              style={{
                width: `${(completedCount / totalCount) * 100}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Due Alert */}
        <div className="bg-[#D62C2C] text-white rounded-xl p-3 flex items-center gap-2 mb-4">
          <AiOutlineBell className="text-xl" />
          <span className="text-sm font-medium">
            {dueCount} evaluation are due in 48 hours
          </span>
        </div>

        {/* Filter & Sort */}
        <div className="flex justify-between items-center mb-4">
          <button className="flex items-center gap-2 text-sm text-[#939393]">
            <AiOutlineFilter />
            <span>Filter: All</span>
          </button>
          <button className="text-sm text-[#939393]">Short: Due</button>
        </div>

        {/* Evaluation Task List */}
        <div>
          <h3 className="text-sm font-bold text-[#1B1B1B] mb-3">
            Evaluation Task
          </h3>
          <div className="space-y-3">
            {evaluationTasks.map((task) => (
              <div
                key={task.id}
                className="htga-card p-4 flex gap-4 border-l-4"
                style={{
                  borderLeftColor:
                    task.evaluatorStatus === "Completed"
                      ? "#4CAF50"
                      : task.evaluatorStatus === "Continue"
                      ? "#FFA200"
                      : "#D62C2C",
                }}
              >
                <div
                  className={`w-1 rounded-full ${getStatusColor(
                    task.evaluatorStatus
                  )}`}
                ></div>
                <div className="flex-1">
                  <h4 className="font-bold text-[#1B1B1B] mb-1">
                    {task.name}
                  </h4>
                  <p className="text-xs text-[#939393] mb-1">
                    Location: {task.address.split(",")[0]}
                  </p>
                  <p className="text-xs text-[#939393]">{task.category}</p>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <span className="text-xs text-[#939393]">
                    {formatDate(task.dueDate)}
                  </span>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusBadgeClass(
                      task.evaluatorStatus
                    )}`}
                  >
                    {task.evaluatorStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-black"></div>
    </div>
  );
}
