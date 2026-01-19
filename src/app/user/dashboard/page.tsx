"use client";
import DebugLogger from "@/components/DebugLogger";
import { PushNotificationsContext } from "@/components/notifications/PushNotificationsProvider";
import { useAuth } from "@/context/AuthContext";
import {
  EvaluatorAssignment,
  subscribeToEvaluatorAssignments,
} from "@/lib/assignmentService";
import {
  getFCMToken,
  isNotificationPermissionGranted,
  isPushNotificationSupported,
  removeFCMTokenFromServer,
  saveFCMTokenToServer,
} from "@/lib/fcmTokenHelper";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { MobileLayoutWrapper } from "../../layout-wrapper";

type CategoryFilter = "All" | "Concept" | "Ethnic" | "Specialty";

export default function DashboardPage() {
  const [assignments, setAssignments] = useState<EvaluatorAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>("All");
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  const router = useRouter();
  const { user, ndaSigned, loading: authLoading } = useAuth();
  const {
    messaging,
    isSupported: isPushSupported,
    needsPWAInstall,
  } = useContext(PushNotificationsContext);

  // Fetch Assignments (Real-time)
  useEffect(() => {
    if (authLoading) return;

    if (user?.id) {
      // Subscribe to real-time updates
      const unsubscribe = subscribeToEvaluatorAssignments(user.id, (data) => {
        setAssignments(data);
        setLoading(false);
      });

      // Cleanup subscription on unmount
      return () => {
        if (unsubscribe) unsubscribe();
      };
    } else {
      setLoading(false);
      router.push("/");
    }
  }, [user?.id, authLoading, router]);

  // Check Notification Status & Prompt on Load
  useEffect(() => {
    const checkAndPromptNotifications = async () => {
      // Wait for user to be loaded
      if (!user?.id) return;

      // Check if push notifications are supported
      if (!isPushNotificationSupported()) {
        // Show iOS-specific message if needed
        if (needsPWAInstall) {
          // Add a small delay to ensure UI is ready
          await new Promise((resolve) => setTimeout(resolve, 1000));

          await Swal.fire({
            title: "📱 Install App for Notifications",
            html: `
              <div style="text-align: left; font-size: 14px;">
                <p>To receive push notifications on iOS:</p>
                <ol style="margin-top: 8px; padding-left: 20px;">
                  <li>Tap the <strong>Share</strong> button (⬆️) at the bottom of Safari</li>
                  <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                  <li>Tap <strong>"Add"</strong> in the top right</li>
                  <li>Open the app from your Home Screen</li>
                </ol>
              </div>
            `,
            icon: "info",
            confirmButtonColor: "#FFA200",
            confirmButtonText: "Got it!",
          });
        }
        return;
      }

      const granted = isNotificationPermissionGranted();
      setNotificationEnabled(granted);

      // If granted, ensure token is synced to server
      if (granted && messaging) {
        try {
          const token = await getFCMToken(messaging);
          if (token) {
            await saveFCMTokenToServer(token, user.id);
          }
        } catch (error) {
          console.error("Error syncing FCM token:", error);
        }
      }

      // If not granted, prompt user (as requested to keep the flow)
      if (!granted && messaging) {
        // Add a small delay to ensure UI is ready
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const result = await Swal.fire({
          title: "Enable Notifications?",
          text: "Stay updated with your latest assignments and deadlines.",
          icon: "question",
          showCancelButton: true,
          confirmButtonColor: "#FFA200",
          cancelButtonColor: "#d33",
          confirmButtonText: "Yes, enable it!",
        });

        if (result.isConfirmed) {
          handleToggleNotification(true);
        }
      }
    };

    checkAndPromptNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, messaging, needsPWAInstall]);

  const handleToggleNotification = async (forceEnable = false) => {
    // Check if push is supported
    if (!isPushSupported) {
      if (needsPWAInstall) {
        await Swal.fire({
          title: "📱 Install App First",
          html: `
            <div style="text-align: left; font-size: 14px;">
              <p>Push notifications require the app to be installed:</p>
              <ol style="margin-top: 8px; padding-left: 20px;">
                <li>Tap the <strong>Share</strong> button (⬆️)</li>
                <li>Tap <strong>"Add to Home Screen"</strong></li>
                <li>Open from Home Screen</li>
              </ol>
            </div>
          `,
          icon: "info",
          confirmButtonColor: "#FFA200",
        });
      } else {
        await Swal.fire({
          title: "Not Supported",
          text: "Push notifications are not supported on this browser.",
          icon: "warning",
          confirmButtonColor: "#FFA200",
        });
      }
      return;
    }

    if (!messaging || !user?.id) return;

    if (notificationEnabled && !forceEnable) {
      // Unsubscribe
      const result = await Swal.fire({
        title: "Disable Notifications?",
        text: "You won't receive updates about your assignments.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, disable",
      });

      if (result.isConfirmed) {
        try {
          const token = await getFCMToken(messaging);
          if (token) {
            await removeFCMTokenFromServer(token, user.id);
          }
          setNotificationEnabled(false);
          Swal.fire(
            "Disabled!",
            "Notifications have been disabled.",
            "success",
          );
        } catch (error) {
          console.error("Error disabling notifications:", error);
        }
      }
    } else {
      // Subscribe - Step 1: Request Permission
      Swal.fire({
        title: "Requesting Permission",
        text: "Please allow notifications...",
        allowOutsideClick: false,
        showConfirmButton: false,
        width: "80%",
        didOpen: () => {
          Swal.showLoading();
        },
      });

      try {
        const token = await getFCMToken(messaging);

        if (token) {
          // Step 2: Saving with Progress Bar (2s delay)
          await Swal.fire({
            title: "Saving Settings",
            text: "Syncing with server...",
            timer: 2000,
            timerProgressBar: true,
            allowOutsideClick: false,
            showConfirmButton: false,
            width: "80%",
          });

          await saveFCMTokenToServer(token, user.id);
          setNotificationEnabled(true);

          // Step 3: Success
          Swal.fire({
            icon: "success",
            title: "All Set!",
            text: "Notifications enabled!",
            confirmButtonColor: "#FFA200",
            timer: 2000,
            timerProgressBar: true,
            width: "80%",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Permission Denied",
            text: "Please allow notifications in your browser settings.",
            confirmButtonColor: "#FFA200",
            width: "80%",
          });
        }
      } catch (error) {
        console.error("Error enabling notifications:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to enable notifications.",
          confirmButtonColor: "#FFA200",
          width: "80%",
        });
      }
    }
  };

  const handleStartEvaluation = (assignment: EvaluatorAssignment): void => {
    if (!user) return;

    console.log("[Dashboard] handleStartEvaluation assignment:", assignment);
    console.log("[Dashboard] uniqueId value:", assignment.uniqueId);

    const baseUrl =
      "https://forms.zohopublic.com/proyekkonsultasi733gm1/form/RestaurantEvaluationForm/formperma/iB4YV9jabNPVAx_y8WCcrLouSJhkgK-0h-lve1jLGWk";
    const params = new URLSearchParams({
      unique_id: assignment.uniqueId || "",
      assignment_id: assignment.id,
      eva_email: user.email || "",
      eva_id: user.id,
      restaurant_name: assignment.establishment.name,
    });

    console.log("[Dashboard] Final URL:", `${baseUrl}?${params.toString()}`);
    window.open(`${baseUrl}?${params.toString()}`, "_blank");
  };

  const handleProfile = (): void => {
    router.push("/user/profile");
  };

  const handleNotifications = (): void => {
    router.push("/user/notifications");
  };

  const handleSubmitForm = async (
    assignment: EvaluatorAssignment,
  ): Promise<void> => {
    const result = await Swal.fire({
      title: "Before you submit",
      html: `
        <div style="text-align:left;font-size:14px;line-height:1.4;">
          <p style="margin-bottom:8px;">Please make sure you have:</p>
          <ul style="padding-left:18px;">
            <li>Visited the restaurant</li>
            <li>Completed all required form sections</li>
            <li>Saved your notes and scores</li>
          </ul>
        </div>
      `,
      icon: "info",
      showCancelButton: true,
      confirmButtonColor: "#1B1B1B",
      cancelButtonColor: "#d33",
      confirmButtonText: "Continue to Form",
    });

    if (result.isConfirmed) {
      handleStartEvaluation(assignment);
    }
  };

  const handleClaimSubmission = async (
    assignment: EvaluatorAssignment,
  ): Promise<void> => {
    await Swal.fire({
      title: "Claim Submission",
      text: "Receipt capture will open here once the page is ready.",
      icon: "info",
      confirmButtonColor: "#1B1B1B",
    });
    console.log("[Dashboard] Claim submission for", assignment.id);
  };

  const handleReassign = async (
    assignment: EvaluatorAssignment,
  ): Promise<void> => {
    const result = await Swal.fire({
      title: "Request Reassign",
      input: "textarea",
      inputLabel: "Reason",
      inputPlaceholder: "Tell us why you need a reassign...",
      inputAttributes: { "aria-label": "Reassign reason" },
      showCancelButton: true,
      confirmButtonColor: "#1B1B1B",
      confirmButtonText: "Send Request",
    });

    if (result.isConfirmed && result.value) {
      await Swal.fire({
        icon: "success",
        title: "Request sent",
        text: "Admin has been notified.",
        confirmButtonColor: "#1B1B1B",
      });
      console.log("[Dashboard] Reassign request", {
        assignmentId: assignment.id,
        reason: result.value,
      });
    }
  };

  const handleReport = async (
    assignment: EvaluatorAssignment,
  ): Promise<void> => {
    const result = await Swal.fire({
      title: "Report Issue",
      input: "select",
      inputOptions: {
        closed: "Restaurant closed",
        food_poisoning: "Food poisoning",
      },
      inputPlaceholder: "Select a reason",
      showCancelButton: true,
      confirmButtonColor: "#1B1B1B",
      confirmButtonText: "Send Report",
    });

    if (result.isConfirmed && result.value) {
      await Swal.fire({
        icon: "success",
        title: "Report sent",
        text: "Admin has been notified.",
        confirmButtonColor: "#1B1B1B",
      });
      console.log("[Dashboard] Report issue", {
        assignmentId: assignment.id,
        reason: result.value,
      });
    }
  };

  // Filtering
  const filteredAssignments = assignments.filter((a) => {
    if (selectedCategory === "All") return true;
    return (
      a.establishment.category?.toLowerCase() === selectedCategory.toLowerCase()
    );
  });

  const submittedCount = assignments.filter(
    (a) => a.status === "submitted" || a.status === "completed",
  ).length;
  const claimedCount = assignments.filter(
    (a) => a.status === "completed",
  ).length;
  const totalCount = assignments.length;

  const submittedProgress =
    totalCount > 0 ? (submittedCount / totalCount) * 100 : 0;
  const claimedProgress =
    totalCount > 0 ? (claimedCount / totalCount) * 100 : 0;

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
      <DebugLogger />
      <div className="min-h-screen bg-gray-50 pb-24 font-sans">
        {/* Header Section */}
        <div className="bg-white shadow-sm pt-12 pb-6 px-6 rounded-b-3xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-gray-500 text-sm font-medium">Welcome back,</p>
              <h2 className="text-2xl font-bold text-gray-900">
                {user?.name || "Evaluator"}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleNotifications}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors relative"
              >
                <svg
                  className="w-6 h-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {/* Optional: Red dot for unread */}
              </button>
              <button onClick={handleProfile} className="relative">
                <div className="w-10 h-10 rounded-full bg-[#FFA200] flex items-center justify-center text-white font-bold shadow-md">
                  {user?.name?.charAt(0).toUpperCase() || "E"}
                </div>
              </button>
            </div>
          </div>

          {/* Status Cards Row */}
          <div className="flex gap-3 mb-2 overflow-x-auto pb-2">
            {/* NDA Status */}
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${ndaSigned ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {ndaSigned ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                )}
              </svg>
              {ndaSigned ? "NDA Signed" : "NDA Pending"}
            </div>

            {/* Notification Toggle */}
            <button
              onClick={() => handleToggleNotification()}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${notificationEnabled ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-600"}`}
            >
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
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {notificationEnabled ? "Notif On" : "Notif Off"}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 pt-6">
          {/* Progress Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-8">
            <h3 className="text-gray-900 text-lg font-bold mb-6">
              Evaluation Progress
            </h3>

            <div className="space-y-6">
              {/* Submitted Progress */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-50">
                      <svg
                        className="w-4 h-4 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      Forms Submitted
                    </span>
                  </div>
                  <span className="text-sm font-bold text-blue-600">
                    {submittedCount}/{totalCount}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(37,99,235,0.3)]"
                    style={{ width: `${submittedProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* Claimed Progress */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-green-50">
                      <svg
                        className="w-4 h-4 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      Claims Processed
                    </span>
                  </div>
                  <span className="text-sm font-bold text-green-600">
                    {claimedCount}/{totalCount}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-green-600 h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(22,163,74,0.3)]"
                    style={{ width: `${claimedProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {(
                ["All", "Concept", "Ethnic", "Specialty"] as CategoryFilter[]
              ).map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    selectedCategory === category
                      ? "bg-[#1B1B1B] text-white shadow-md"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Assignments List */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Your Assignments
            </h3>

            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFA200]"></div>
              </div>
            ) : filteredAssignments.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-300">
                <p className="text-gray-500">No assignments found.</p>
              </div>
            ) : (
              filteredAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  {/* Status Stripe */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                      assignment.status === "completed"
                        ? "bg-green-500"
                        : assignment.status === "submitted"
                          ? "bg-blue-500"
                          : "bg-[#FFA200]"
                    }`}
                  ></div>

                  <div className="flex justify-between items-start mb-3 pl-2">
                    <div>
                      <span className="inline-block px-2 py-1 rounded-md bg-gray-100 text-xs font-semibold text-gray-600 mb-2">
                        {assignment.establishment.category}
                      </span>
                      <h4 className="text-lg font-bold text-gray-900 leading-tight">
                        {assignment.establishment.name}
                      </h4>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        assignment.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : assignment.status === "submitted"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {assignment.status === "completed"
                        ? "Completed"
                        : assignment.status === "submitted"
                          ? "Submitted"
                          : "Pending"}
                    </span>
                  </div>

                  <div className="pl-2 mb-4">
                    <p className="text-sm text-gray-500 flex items-center gap-1 mb-1">
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
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {assignment.establishment.address ||
                        "No address provided"}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
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
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Assigned: {formatDate(assignment.assignedAt)}
                    </p>
                  </div>

                  <div className="pl-2 space-y-3">
                    <button
                      onClick={() => {
                        if (assignment.status === "pending") {
                          handleSubmitForm(assignment);
                          return;
                        }

                        if (assignment.status === "submitted") {
                          handleClaimSubmission(assignment);
                        }
                      }}
                      disabled={assignment.status === "completed"}
                      className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                        assignment.status === "completed"
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : assignment.status === "submitted"
                            ? "bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-orange-100"
                            : "bg-[#1B1B1B] text-white hover:bg-black shadow-lg shadow-gray-200"
                      }`}
                    >
                      {assignment.status === "completed"
                        ? "Completed"
                        : assignment.status === "submitted"
                          ? "Claim Submission"
                          : "Submit Form"}
                      <div
                        className={
                          assignment.status === "completed"
                            ? "hidden"
                            : "transform transition-transform group-hover:translate-x-1"
                        }
                      >
                        {" "}
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
                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                          />
                        </svg>
                      </div>
                    </button>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleReassign(assignment)}
                        disabled={assignment.status !== "pending"}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold border transition-all ${
                          assignment.status !== "pending"
                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                            : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h11l-1.5-1.5M3 14h11l-1.5 1.5M14 6h7v12h-7"
                          />
                        </svg>
                        Reassign
                      </button>
                      <button
                        onClick={() => handleReport(assignment)}
                        disabled={assignment.status !== "pending"}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold border transition-all ${
                          assignment.status !== "pending"
                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                            : "border border-red-200 text-red-600 bg-red-50 hover:bg-red-100"
                        }`}
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        Report
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </MobileLayoutWrapper>
  );
}
