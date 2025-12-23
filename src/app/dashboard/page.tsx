"use client";
import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { dummyEstablishments } from "@/data/dummyData";
import { MobileLayoutWrapper } from "../layout-wrapper";
import { PushNotificationsContext } from "@/components/notifications/PushNotificationsProvider";
import {
  getFCMToken,
  saveFCMTokenToServer,
  storeFCMToken,
  isNotificationPermissionGranted,
} from "@/lib/fcmTokenHelper";

type CategoryFilter = "All" | "Concept" | "Ethnic" | "Specialty";

export default function DashboardPage() {
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>("All");
  const router = useRouter();
  const { user } = useAuth();
  const messaging = useContext(PushNotificationsContext);

  // Silent auto-collection of FCM token in background
  useEffect(() => {
    const collectToken = async () => {
      if (!user?.id || !messaging) return;

      // Only auto-collect if permission already granted (silent)
      if (isNotificationPermissionGranted()) {
        try {
          const token = await getFCMToken(messaging);
          if (token) {
            const saved = await saveFCMTokenToServer(token, user.id);
            if (saved) {
              storeFCMToken(token);
              console.log("✅ Notification token auto-saved");
            }
          }
        } catch (error) {
          console.error("Silent token collection error:", error);
          // Fail silently - don't interrupt user experience
        }
      }
    };

    collectToken();
  }, [user, messaging]);

  const handleDownloadGuide = () => {
    alert("Download Guide functionality - Coming Soon!");
  };

  const handleProfile = () => {
    router.push("/profile");
  };

  const handleNotifications = () => {
    router.push("/notifications");
  }

  const filteredEstablishments = dummyEstablishments.filter((est) => {
    if (selectedCategory === "All") return true;
    return est.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  const completedCount = filteredEstablishments.filter(
    (est) => est.evaluators[0]?.status === "Completed"
  ).length;
  const totalCount = filteredEstablishments.length;

  const evaluationTasks = filteredEstablishments.map((est) => ({
    ...est,
    evaluatorStatus: est.evaluators[0]?.status || "Start",
    dueDate: est.dateAssigned,
  }));

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
    <MobileLayoutWrapper>
      <div className="min-h-screen bg-cream pb-24">
        {/* Header */}
        <div className="bg-cream pt-12 pb-4 px-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-[#1B1B1B]">
                Good Morning,
              </h2>
              <h2 className="text-2xl font-bold text-[#1B1B1B]">
                {user?.name || "Evaluator Name"}!
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleNotifications} className="relative">
                <svg
                  className="w-6 h-6 text-[#1B1B1B]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
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
            onClick={handleDownloadGuide}
            className="w-full bg-[#FFEDCC] hover:bg-[#FFE5B4] rounded-full py-3 px-4 flex items-center justify-center gap-2 mb-4 transition-all"
          >
            <svg
              className="w-5 h-5 text-[#1B1B1B]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span className="text-[#1B1B1B] font-medium">
              Download the Guide
            </span>
          </button>

          {/* Category Filters */}
          <div className="mb-4">
            <h3 className="text-sm font-bold text-[#1B1B1B] mb-3">
              Evaluation Category
            </h3>
            <div className="flex gap-2 flex-wrap">
              {(
                ["All", "Concept", "Ethnic", "Specialty"] as CategoryFilter[]
              ).map((category) => (
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
              ))}
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
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            <span className="text-sm font-medium">
              {dueCount} evaluation are due in 48 hours
            </span>
          </div>

          {/* Filter & Sort */}
          <div className="flex justify-between items-center mb-4">
            <button className="flex items-center gap-2 text-sm text-[#939393]">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
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
    </MobileLayoutWrapper>
  );
}
