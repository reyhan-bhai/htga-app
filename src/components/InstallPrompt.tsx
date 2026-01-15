"use client";

import { isRunningAsPWA } from "@/lib/fcmTokenHelper";
import { DeviceTypes, useDevice } from "@/utils/useDevice";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const pathname = usePathname();
  const device = useDevice();
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // 1. Check if Admin Page -> Don't show
    if (pathname?.startsWith("/admin")) {
      setShowPrompt(false);
      return;
    }

    // 2. Check if Login Page -> Only show on login screen
    if (pathname !== "/") {
      setShowPrompt(false);
      return;
    }

    // 3. Check if PWA -> Don't show if already installed
    if (isRunningAsPWA()) {
      setShowPrompt(false);
      return;
    }

    // 4. Show for all users on Login Page who haven't installed the app
    // This ensures it works on Desktop (for testing) and Mobile
    setShowPrompt(false);

    // Android/Desktop - listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, [pathname]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  const isIOSDevice = device === DeviceTypes.IOS;

  return (
    <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center animate-in fade-in zoom-in duration-300 border border-gray-100">
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center text-4xl shadow-sm">
            📱
          </div>
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          Install App Required
        </h3>

        <p className="text-gray-600 mb-8 text-base leading-relaxed">
          You must install the <strong>HTGA App</strong> to access the system.
          This ensures the best experience and security.
        </p>

        {isIOSDevice ? (
          <div className="bg-gray-50 rounded-2xl p-5 text-left border border-gray-100">
            <ol className="text-sm text-gray-700 space-y-4">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                  1
                </span>
                <span>
                  Tap the <strong>Share</strong> button{" "}
                  <span className="text-blue-500 text-lg leading-none inline-block align-middle">
                    ⎋
                  </span>{" "}
                  below
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                  2
                </span>
                <span>
                  Scroll down and tap{" "}
                  <strong>&quot;Add to Home Screen&quot;</strong>{" "}
                  <span className="text-gray-400 text-lg leading-none inline-block align-middle">
                    ⊞
                  </span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                  3
                </span>
                <span>
                  Tap <strong>&quot;Add&quot;</strong> in the top right corner
                </span>
              </li>
            </ol>
          </div>
        ) : (
          <div className="space-y-4">
            {deferredPrompt ? (
              <button
                onClick={handleInstallClick}
                className="w-full bg-[#FFA200] hover:bg-[#FF9500] text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-orange-200 transition-all active:scale-95 text-lg"
              >
                Install App Now
              </button>
            ) : (
              <div className="bg-gray-50 rounded-2xl p-5 text-sm text-gray-600 border border-gray-100">
                <p className="mb-3 font-semibold text-gray-900 text-base">
                  To install:
                </p>
                <p className="leading-relaxed">
                  Tap/Click the browser menu (⋮) and select{" "}
                  <strong>&quot;Install App&quot;</strong> or{" "}
                  <strong>&quot;Add to Home Screen&quot;</strong>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
