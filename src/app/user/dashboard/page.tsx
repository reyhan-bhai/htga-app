"use client";
import DebugLogger from "@/components/DebugLogger";
import { useAuth } from "@/context/AuthContext";
import {
  EvaluatorAssignment,
  subscribeToEvaluatorAssignments,
} from "@/lib/assignmentService";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { MobileLayoutWrapper } from "../../layout-wrapper";

// Import your new refactored components
import AssignmentList from "@/components/dashboard/AssignmentList";
import ClaimModal from "@/components/dashboard/ClaimModal";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ProgressStats from "@/components/dashboard/ProgressStats";
import RecommendationBanner from "@/components/dashboard/RecommendationBanner";
import RequestRestaurantModal from "@/components/dashboard/RequestRestaurantModal";

// Helper to use Notification Logic (optional: you can keep logic here or move to hook)
import { PushNotificationsContext } from "@/components/notifications/PushNotificationsProvider";
import {
  getFCMToken,
  isNotificationPermissionGranted,
  isPushNotificationSupported,
  removeFCMTokenFromServer,
  saveFCMTokenToServer,
} from "@/lib/fcmTokenHelper";
import { useContext } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, ndaSigned, loading: authLoading } = useAuth();
  const { messaging, needsPWAInstall } = useContext(PushNotificationsContext);

  // --- State ---
  const [assignments, setAssignments] = useState<EvaluatorAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Notification State
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  // Modal State
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] =
    useState<EvaluatorAssignment | null>(null);

  // --- Effects ---

  // 1. Fetch Data
  useEffect(() => {
    if (authLoading) return;

    if (user?.id) {
      const unsubscribe = subscribeToEvaluatorAssignments(user.id, (data) => {
        setAssignments(data);
        setLoading(false);
      });
      return () => {
        if (unsubscribe) unsubscribe();
      };
    } else {
      setLoading(false);
      router.push("/");
    }
  }, [user?.id, authLoading, router]);

  // 2. Check Notification Status on Load
  useEffect(() => {
    const checkNotifications = async () => {
      if (!user?.id) return;

      // Basic check
      if (isNotificationPermissionGranted()) {
        setNotificationEnabled(true);
        // Ensure token sync
        if (messaging) {
          const token = await getFCMToken(messaging);
          if (token) saveFCMTokenToServer(token, user.id);
        }
      }

      // Note: I removed the auto-prompt logic here to keep the code clean.
      // The user can click the toggle button in the header to enable it.
    };
    checkNotifications();
  }, [user?.id, messaging]);

  // --- Handlers ---

  const handleToggleNotification = async () => {
    if (!isPushNotificationSupported()) {
      // Handle unsupported/PWA logic
      if (needsPWAInstall) {
        Swal.fire({
          icon: "info",
          title: "Install App",
          text: "Please add to home screen to enable notifications.",
        });
      } else {
        Swal.fire({
          icon: "warning",
          title: "Not Supported",
          text: "Push notifications are not supported here.",
        });
      }
      return;
    }

    if (!messaging || !user?.id) return;

    if (notificationEnabled) {
      // Disable
      const result = await Swal.fire({
        title: "Disable Notifications?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        confirmButtonText: "Yes, disable",
      });
      if (result.isConfirmed) {
        const token = await getFCMToken(messaging);
        if (token) await removeFCMTokenFromServer(token, user.id);
        setNotificationEnabled(false);
        Swal.fire("Disabled!", "Notifications disabled.", "success");
      }
    } else {
      // Enable
      try {
        const token = await getFCMToken(messaging);
        if (token) {
          await saveFCMTokenToServer(token, user.id);
          setNotificationEnabled(true);
          Swal.fire("Success", "Notifications enabled!", "success");
        } else {
          Swal.fire(
            "Permission Denied",
            "Please allow notifications in browser settings.",
            "error",
          );
        }
      } catch (e) {
        console.error(e);
        Swal.fire("Error", "Failed to enable notifications.", "error");
      }
    }
  };

  const handleStartEvaluation = (assignment: EvaluatorAssignment) => {
    if (!user) return;
    const baseUrl =
      "https://forms.zohopublic.com/proyekkonsultasi733gm1/form/RestaurantEvaluationForm/formperma/iB4YV9jabNPVAx_y8WCcrLouSJhkgK-0h-lve1jLGWk";
    const params = new URLSearchParams({
      unique_id: assignment.uniqueId || "",
      assignment_id: assignment.id,
      eva_email: user.email || "",
      eva_id: user.id,
      restaurant_name: assignment.establishment.name,
    });
    window.open(`${baseUrl}?${params.toString()}`, "_blank");
  };

  const handleSubmitForm = async (assignment: EvaluatorAssignment) => {
    const result = await Swal.fire({
      title: "Before you submit",
      html: `<div style="text-align:left;font-size:14px;">Make sure you have visited the restaurant and completed all sections.</div>`,
      icon: "info",
      showCancelButton: true,
      confirmButtonColor: "#1B1B1B",
      confirmButtonText: "Continue to Form",
    });

    if (result.isConfirmed) {
      handleStartEvaluation(assignment);
    }
  };

  const handleOpenClaim = (assignment: EvaluatorAssignment) => {
    setSelectedAssignment(assignment);
    setIsClaimModalOpen(true);
  };

  const handleRestaurantRequestSubmit = async (data: {
    name: string;
    location: string;
    cuisine: string;
    notes: string;
  }) => {
    if (!user) {
      throw new Error("User not available");
    }

    const response = await fetch("/api/user/restaurant-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        evaluatorId: user.id,
        submitterName: user.name || user.email || "Evaluator",
        restaurantName: data.name,
        category: data.cuisine || "-",
        address: data.location,
        notes: data.notes || "-",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to submit request");
    }
  };

  const handleReassign = async (assignment: EvaluatorAssignment) => {
    const result = await Swal.fire({
      title: "Request Reassign",
      html: `<div style="text-align:left;font-size:14px;">${assignment.establishment.name}</div>`,
      input: "textarea",
      inputPlaceholder: "Reason...",
      showCancelButton: true,
      confirmButtonColor: "#1B1B1B",
    });
    if (result.isConfirmed && result.value) {
      if (!user) return;

      try {
        const response = await fetch("/api/user/reassign-requests", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            evaluatorId: user.id,
            evaluatorName: user.name || user.email || "Evaluator",
            assignId: assignment.id,
            restaurantName: assignment.establishment.name,
            reason: result.value,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to submit reassign request");
        }

        Swal.fire("Sent", "Admin notified.", "success");
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to send reassign request.", "error");
      }
    }
  };

  const handleReport = async (assignment: EvaluatorAssignment) => {
    const result = await Swal.fire({
      title: "Report Issue",
      html: `<div style="text-align:left;font-size:14px;">${assignment.establishment.name}</div>`,
      input: "select",
      inputOptions: { closed: "Closed", food_poisoning: "Food Poisoning" },
      showCancelButton: true,
      confirmButtonColor: "#1B1B1B",
    });
    if (result.isConfirmed && result.value) {
      const detailsResult = await Swal.fire({
        title: "Add details (optional)",
        input: "textarea",
        inputPlaceholder: "Describe the issue...",
        showCancelButton: true,
        confirmButtonColor: "#1B1B1B",
      });

      if (!detailsResult.isConfirmed) return;

      if (!user) return;

      try {
        const response = await fetch("/api/user/report-requests", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            evaluatorId: user.id,
            reporterName: user.name || user.email || "Evaluator",
            assignId: assignment.id,
            restaurantName: assignment.establishment.name,
            issueType:
              result.value === "closed"
                ? "Restaurant Closed"
                : "Food Poisoning",
            description: detailsResult.value || "Reported by evaluator",
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to submit report");
        }

        Swal.fire("Sent", "Report sent to admin.", "success");
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to send report.", "error");
      }
    }
  };

  // --- Render ---
  return (
    <MobileLayoutWrapper>
      <DebugLogger />
      <div className="min-h-screen bg-gray-50 pb-24 font-sans">
        <DashboardHeader
          user={user}
          ndaSigned={ndaSigned}
          notificationEnabled={notificationEnabled}
          onToggleNotification={handleToggleNotification}
          onProfileClick={() => router.push("/user/profile")}
          onNotificationsClick={() => router.push("/user/notifications")}
        />

        <div className="px-6 pt-6">
          <ProgressStats assignments={assignments} />

          <RecommendationBanner onOpen={() => setIsRequestModalOpen(true)} />

          <AssignmentList
            assignments={assignments}
            loading={loading}
            onSubmit={handleSubmitForm}
            onClaim={handleOpenClaim}
            onReassign={handleReassign}
            onReport={handleReport}
          />
        </div>

        {/* Modals */}
        <ClaimModal
          isOpen={isClaimModalOpen}
          onClose={() => setIsClaimModalOpen(false)}
          assignment={selectedAssignment}
          userId={user?.id || ""}
        />

        <RequestRestaurantModal
          isOpen={isRequestModalOpen}
          onClose={() => setIsRequestModalOpen(false)}
          onSubmit={handleRestaurantRequestSubmit}
        />
      </div>
    </MobileLayoutWrapper>
  );
}
