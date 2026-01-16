"use client";

import { NotificationHeader, NotificationList } from "@/components/evaluator";
import { useNotificationsLogic } from "@/components/evaluator/hooks/useNotificationsLogic";
import { MobileLayoutWrapper } from "../../layout-wrapper";

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
