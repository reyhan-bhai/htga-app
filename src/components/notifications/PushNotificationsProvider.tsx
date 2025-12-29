"use client";
import {
  isIOS,
  isPushNotificationSupported,
  isRunningAsPWA,
} from "@/lib/fcmTokenHelper";
import { app } from "@/lib/firebase";
import { getMessaging, Messaging, onMessage } from "firebase/messaging";
import React, {
  createContext,
  PropsWithChildren,
  useEffect,
  useState,
} from "react";

interface PushNotificationContextType {
  messaging: Messaging | undefined;
  isSupported: boolean;
  isIOSDevice: boolean;
  isStandalone: boolean;
  needsPWAInstall: boolean;
}

export const PushNotificationsContext =
  createContext<PushNotificationContextType>({
    messaging: undefined,
    isSupported: false,
    isIOSDevice: false,
    isStandalone: false,
    needsPWAInstall: false,
  });

const PushNotificationsProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [isClient, setIsClient] = useState(false);
  const [messaging, setMessaging] = useState<Messaging | undefined>(undefined);
  const [isSupported, setIsSupported] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setIsIOSDevice(isIOS());
    setIsStandalone(isRunningAsPWA());
    setIsSupported(isPushNotificationSupported());
  }, []);

  useEffect(() => {
    try {
      // Only initialize Firebase Messaging if push is supported
      if (isClient && isPushNotificationSupported()) {
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
      } else if (isClient) {
        console.log("Push notifications not supported - iOS requires PWA mode");
      }
    } catch (error) {
      console.log("Error initializing Firebase:", error);
    }
  }, [isClient]);

  const contextValue: PushNotificationContextType = {
    messaging,
    isSupported,
    isIOSDevice,
    isStandalone,
    needsPWAInstall: isIOSDevice && !isStandalone,
  };

  if (!isClient) {
    return <>{children}</>;
  }

  return (
    <PushNotificationsContext.Provider value={contextValue}>
      {children}
    </PushNotificationsContext.Provider>
  );
};

export default PushNotificationsProvider;
