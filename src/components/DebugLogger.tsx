"use client";
import { isSupported } from "firebase/messaging";
import { useEffect, useState } from "react";

export default function DebugLogger() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const addLog = (msg: string) => setLogs((prev) => [...prev, msg]);

  useEffect(() => {
    const checkSupport = async () => {
      addLog(`[INIT] Checking Environment...`);
      addLog(`User Agent: ${navigator.userAgent}`);
      addLog(`Secure Context: ${window.isSecureContext ? "YES" : "NO"}`);
      addLog(
        `ServiceWorker in navigator: ${"serviceWorker" in navigator ? "YES" : "NO"}`
      );
      addLog(
        `PushManager in window: ${"PushManager" in window ? "YES" : "NO"}`
      );
      addLog(
        `Notification in window: ${"Notification" in window ? "YES" : "NO"}`
      );

      try {
        const supported = await isSupported();
        addLog(`Firebase isSupported(): ${supported ? "YES" : "NO"}`);
      } catch (e: any) {
        addLog(`Firebase Error: ${e.message}`);
      }

      // Cek akses file SW
      try {
        addLog(`Fetching SW file...`);
        const swRes = await fetch("/firebase-messaging-sw.js");
        addLog(`SW File Status: ${swRes.status}`);
        const contentType = swRes.headers.get("content-type");
        addLog(`SW Content-Type: ${contentType}`);
      } catch (e: any) {
        addLog(`SW Fetch Error: ${e.message}`);
      }
    };

    checkSupport();
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs z-[99999] opacity-50 hover:opacity-100 shadow-lg"
      >
        Show Debug
      </button>
    );
  }

  return (
    <div className="fixed top-0 left-0 w-full h-2/3 bg-black/95 text-green-400 text-xs p-4 overflow-y-auto z-[99999] font-mono border-b-2 border-green-500">
      <div className="flex justify-between items-center border-b border-green-500 mb-2 pb-2 sticky top-0 bg-black/95 pt-2">
        <h3 className="font-bold text-lg">DEBUG LOGS</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setLogs([])}
            className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-700"
          >
            Clear
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="px-3 py-1 bg-red-900 text-white rounded hover:bg-red-800"
          >
            Close
          </button>
        </div>
      </div>
      <div className="space-y-1">
        {logs.map((log, i) => (
          <div
            key={i}
            className="border-b border-gray-800 pb-1 break-all font-mono"
          >
            <span className="text-gray-500 mr-2">[{i + 1}]</span>
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}
