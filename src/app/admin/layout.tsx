"use client";

import DrawerComponent from "@/components/drawer/DrawerComponent";
import { Poppins } from "next/font/google";
import React, { useState } from "react";
import { MdMenu } from "react-icons/md";
import { UserProvider } from "@/utils/useCurrentUser";
import PushNotificationsProvider from "@/components/notifications/PushNotificationsProvider";
import { EvaluatorsProvider } from "@/context/EvaluatorContext";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <UserProvider>
      <PushNotificationsProvider>
        <div className={`flex h-screen bg-[#FFEDCC]`}>
          <DrawerComponent
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Mobile Header */}
            <header className="md:hidden bg-white p-4 flex items-center shadow-sm">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="text-[#FF6B00] hover:bg-orange-50 p-2 rounded transition-colors"
              >
                <MdMenu size={28} />
              </button>
              <span
                className={`ml-4 font-bold text-lg text-gray-700 ${poppins.className}`}
              >
                HTGA Admin
              </span>
            </header>

            <main className={`flex-1 overflow-auto p-6 ${poppins.className}`}>
              <EvaluatorsProvider>
                {children}
              </EvaluatorsProvider>
            </main>
          </div>
        </div>
      </PushNotificationsProvider>
    </UserProvider>
  );
}
