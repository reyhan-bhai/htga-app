import { useState } from "react";
import { useRouter } from "next/navigation";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  category: "evaluation" | "nda" | "system";
};

export const useNotificationsLogic = () => {
  const router = useRouter();
  const [notifications] = useState<NotificationItem[]>([
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
  ]);

  const handleBack = () => {
    router.push("/dashboard");
  };


  const groupedNotifications = {
    today: notifications.slice(0, 2),
    thisWeek: notifications.slice(2, 4),
  };

  return {
    notifications,
    groupedNotifications,
    handleBack,

  };
};
