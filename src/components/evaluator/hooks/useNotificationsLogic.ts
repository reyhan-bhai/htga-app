import { useRouter } from "next/navigation";
import { useState } from "react";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  category: "evaluation" | "nda" | "system";
};

const initialNotifications: NotificationItem[] = [
  {
    id: "n1",
    title: "Halal Gastronomy Awards",
    body: "Your evaluation at Gacoan will due to A, B, C",
    time: "10 min ago",
    category: "evaluation",
  },
  {
    id: "n2",
    title: "Halal Gastronomy Awards",
    body: "NDA received",
    time: "10 min ago",
    category: "nda",
  },
  {
    id: "n3",
    title: "Halal Gastronomy Awards",
    body: "Your evaluation at Gacoan will due to A, B, C",
    time: "10 min ago",
    category: "evaluation",
  },
  {
    id: "n4",
    title: "Halal Gastronomy Awards",
    body: "NDA received",
    time: "10 min ago",
    category: "nda",
  },
];

export const useNotificationsLogic = () => {
  const router = useRouter();
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(initialNotifications);

  const handleBack = () => {
    router.push("/user/dashboard");
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  const groupedNotifications = {
    today: notifications.slice(0, 2),
    thisWeek: notifications.slice(2, 4),
  };

  return {
    notifications,
    groupedNotifications,
    handleBack,
    removeNotification,
  };
};
