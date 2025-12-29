// Helper functions untuk FCM Token Management
import { getToken, Messaging } from "firebase/messaging";

/**
 * Check if the device is iOS
 */
export function isIOS(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined")
    return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/**
 * Check if app is running as installed PWA (standalone mode)
 */
export function isRunningAsPWA(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * Check if push notifications are supported on this device/browser
 * iOS Safari only supports push notifications when running as a PWA (iOS 16.4+)
 */
export function isPushNotificationSupported(): boolean {
  if (typeof window === "undefined") return false;

  // Check basic requirements
  if (!("serviceWorker" in navigator)) return false;
  if (!("Notification" in window)) return false;
  if (!("PushManager" in window)) return false;

  // iOS specific: Push only works in standalone PWA mode
  if (isIOS() && !isRunningAsPWA()) {
    return false;
  }

  return true;
}

/**
 * Request notification permission and get FCM token
 */
export async function getFCMToken(
  messaging: Messaging | undefined
): Promise<string | null> {
  if (!messaging) {
    console.log("Messaging not initialized");
    return null;
  }

  try {
    // Check if push notifications are supported
    if (!isPushNotificationSupported()) {
      console.log("Push notifications not supported on this device/browser");
      return null;
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission denied");
      return null;
    }

    // Register Service Worker explicitly
    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      console.log("Registering Service Worker...");
      const swUrl =
        process.env.NODE_ENV === "production"
          ? "/sw.js"
          : "/firebase-messaging-sw.js";
      registration = await navigator.serviceWorker.register(swUrl);
    }

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;

    // Get FCM token
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.error("VAPID key not found");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });
    console.log("✅ FCM Token obtained:", token);
    return token;
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
  }
}

/**
 * Save FCM token to server with userId
 */
export async function saveFCMTokenToServer(
  token: string,
  userId: string
): Promise<boolean> {
  try {
    console.log("📤 Saving FCM token to server:", {
      token: token.substring(0, 20) + "...",
      userId,
    });

    const response = await fetch("/api/tokens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, userId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Failed to save token:", errorData);
      throw new Error("Failed to save token");
    }

    const result = await response.json();
    console.log("✅ Token saved successfully:", result);

    // Store token in localStorage for reference
    storeFCMToken(token);

    return true;
  } catch (error) {
    console.error("Error saving token:", error);
    return false;
  }
}

/**
 * Remove FCM token from server
 */
export async function removeFCMTokenFromServer(
  token: string,
  userId: string
): Promise<boolean> {
  try {
    const response = await fetch("/api/tokens", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, userId }),
    });

    if (!response.ok) {
      throw new Error("Failed to remove token");
    }

    console.log("✅ Token removed from server");
    return true;
  } catch (error) {
    console.error("Error removing token:", error);
    return false;
  }
}

/**
 * Check if notification permission is granted
 */
export function isNotificationPermissionGranted(): boolean {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window)) return false;

  // On iOS non-PWA, always return false as notifications won't work
  if (isIOS() && !isRunningAsPWA()) return false;

  return Notification.permission === "granted";
}

/**
 * Get stored FCM token from localStorage
 */
export function getStoredFCMToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("fcm_token");
}

/**
 * Store FCM token in localStorage
 */
export function storeFCMToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("fcm_token", token);
}

/**
 * Remove FCM token from localStorage
 */
export function removeFCMToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("fcm_token");
}
