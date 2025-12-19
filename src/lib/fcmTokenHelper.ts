// Helper functions untuk FCM Token Management
import { getToken } from "firebase/messaging";
import { Messaging } from "firebase/messaging";

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
    // Check if service worker is supported
    if (!("serviceWorker" in navigator)) {
      console.log("Service Worker not supported");
      return null;
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission denied");
      return null;
    }

    // Get FCM token
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.error("VAPID key not found");
      return null;
    }

    const token = await getToken(messaging, { vapidKey });
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
    const response = await fetch("/api/tokens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, userId }),
    });

    if (!response.ok) {
      throw new Error("Failed to save token");
    }

    const data = await response.json();
    console.log("✅ Token saved for user:", userId);
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
