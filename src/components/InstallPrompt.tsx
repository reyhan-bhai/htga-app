"use client";

import { DeviceTypes, useDevice } from "@/utils/useDevice";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Check if the app is running in standalone (installed PWA) mode.
 * Uses matchMedia listener to react to display-mode changes.
 */
function useIsStandalone(): boolean {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // iOS standalone check
    const isIOSStandalone = (window.navigator as any).standalone === true;

    // display-mode: standalone (Android, Desktop Chrome, Edge, etc.)
    const mql = window.matchMedia("(display-mode: standalone)");
    const mqlFullscreen = window.matchMedia("(display-mode: fullscreen)");

    const check = () => {
      setIsStandalone(isIOSStandalone || mql.matches || mqlFullscreen.matches);
    };

    // Initial check
    check();

    // Listen for changes (e.g. app gets installed while page is open)
    mql.addEventListener("change", check);
    mqlFullscreen.addEventListener("change", check);

    return () => {
      mql.removeEventListener("change", check);
      mqlFullscreen.removeEventListener("change", check);
    };
  }, []);

  return isStandalone;
}

export default function InstallPrompt() {
  const pathname = usePathname();
  const device = useDevice();
  const isStandalone = useIsStandalone();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // 1. Admin / SuperAdmin pages are never blocked
    if (pathname?.startsWith("/admin") || pathname?.startsWith("/superadmin")) {
      setShowPrompt(false);
      return;
    }

    // 2. Password reset pages must be accessible from browser (email links open in browser, not PWA)
    if (
      pathname?.startsWith("/user/forgot-password") ||
      pathname?.startsWith("/user/reset-password")
    ) {
      setShowPrompt(false);
      return;
    }

    // 2. Running as installed app (standalone) -> allow access
    if (isStandalone) {
      setShowPrompt(false);
      return;
    }

    // 3. Opened in browser (not installed) -> block access
    setShowPrompt(true);
  }, [pathname, isStandalone]);

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
          <div className="bg-gray-50 rounded-2xl p-5 text-sm text-gray-600 border border-gray-100">
            <p className="mb-3 font-semibold text-gray-900 text-base">
              To install:
            </p>
            <p className="leading-relaxed">
              Click the browser menu{" "}
              <strong className="text-lg leading-none inline-block align-middle">
                ⋮
              </strong>{" "}
              and select <strong>&quot;Install App&quot;</strong> or{" "}
              <strong>&quot;Add to Home Screen&quot;</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
