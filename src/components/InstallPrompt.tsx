"use client";

import { isIOS, isRunningAsPWA } from "@/lib/fcmTokenHelper";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {

    if (isRunningAsPWA()) {
      return;
    }

    // Check if already dismissed
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      // Show again after 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // iOS detection
    if (isIOS()) {
      setShowIOSPrompt(true);
      return;
    }

    // Android/Desktop - listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowAndroidPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowAndroidPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowIOSPrompt(false);
    setShowAndroidPrompt(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  if (showIOSPrompt) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 p-4 z-50">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-gray-800">📱 Install HTGA App</h3>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Install this app for the best experience and push notifications:
          </p>
          <ol className="text-sm text-gray-700 space-y-1 mb-3">
            <li>
              1. Tap the <strong>Share</strong> button{" "}
              <span className="text-blue-500">⬆️</span> below
            </li>
            <li>
              2. Scroll and tap <strong>&quot;Add to Home Screen&quot;</strong>
            </li>
            <li>
              3. Tap <strong>&quot;Add&quot;</strong>
            </li>
          </ol>
          <button
            onClick={handleDismiss}
            className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Maybe later
          </button>
        </div>
      </div>
    );
  }

  if (showAndroidPrompt) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 p-4 z-50">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-gray-800">📱 Install HTGA App</h3>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Install this app for quick access and push notifications.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-[#FFA200] hover:bg-[#FF9500] text-white font-semibold py-2 px-4 rounded-full"
            >
              Install App
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
