"use client";

import { MobileLayoutWrapper } from "../layout-wrapper";
import { useNotificationsLogic } from "@/components/evaluator/hooks/useNotificationsLogic";
import {
  NotificationHeader,
  NotificationList,
} from "@/components/evaluator";

export default function NotificationsPage() {
  const { groupedNotifications, handleBack, removeNotification } =
    useNotificationsLogic();

  return (
    <MobileLayoutWrapper>
      <div className="min-h-screen bg-cream">
        {/* Header */}
        <NotificationHeader onBack={handleBack} />

        {/* Notification List */}
        <NotificationList
          notifications={groupedNotifications}
          onRemove={removeNotification}
        />

        {/* Bottom Navigation Bar */}
        <div className="fixed bottom-0 left-0 right-0 h-1 bg-black"></div>
      </div>
    </MobileLayoutWrapper>
  );
}