"use client";
import { app } from "@/lib/firebase";
import { getMessaging, Messaging, onMessage } from "firebase/messaging";
import React, {
  createContext,
  PropsWithChildren,
  useEffect,
  useState,
} from "react";

export const PushNotificationsContext = createContext<Messaging | undefined>(
  undefined
);

const PushNotificationsProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [isClient, setIsClient] = useState(false);
  const [messaging, setMessaging] = useState<Messaging | undefined>(undefined);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    try {
      if (
        isClient &&
        "serviceWorker" in navigator &&
        "Notification" in window
      ) {
        const messagingInstance = getMessaging(app);
        setMessaging(messagingInstance);

        const unsubscribe = onMessage(messagingInstance, async (payload) => {
          if (Notification.permission === "granted" && payload.notification) {
            const url = payload.data?.url || "/";
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(
              payload?.notification?.title || "",
              {
                body: payload.notification?.body,
                icon: "/logo.svg",
                data: { url },
                actions: [
                  {
                    action: "open_url",
                    title: "Open App",
                  },
                ],
              } as any
            );
          }
        });

        return () => unsubscribe();
      } else {
        console.log("Not supported");
      }
    } catch (error) {
      alert(`Error initializing Firebase: ${error}`);
      console.log("Error initializing Firebase:", error);
    }
  }, [isClient]);

  if (!isClient) {
    return <>{children}</>;
  }

  return (
    <PushNotificationsContext.Provider value={messaging}>
      {children}
    </PushNotificationsContext.Provider>
  );
};

export default PushNotificationsProvider;
