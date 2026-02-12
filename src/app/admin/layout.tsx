"use client";

import DrawerComponent from "@/components/drawer/DrawerComponent";
import PushNotificationsProvider from "@/components/notifications/PushNotificationsProvider";
import { AssignedProvider } from "@/context/admin/AssignedContext";
import { EvaluatorsProvider } from "@/context/admin/EvaluatorContext";
import { RestaurantsProvider } from "@/context/admin/RestaurantContext";
import { useAuth } from "@/context/AuthContext";
import { UserProvider } from "@/utils/useCurrentUser";
import localFont from "next/font/local";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { MdMenu } from "react-icons/md";

const poppins = localFont({
  src: [
    {
      path: "../../../public/fonts/Poppins-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../public/fonts/Poppins-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../../public/fonts/Poppins-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../../public/fonts/Poppins-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-poppins",
});

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/");
      return;
    }
    if (user.role === "superadmin") {
      router.replace("/superadmin");
      return;
    }
    if (user.role !== "admin") {
      router.replace("/user/dashboard");
    }
  }, [authLoading, router, user]);

  const allow = !authLoading && user?.role === "admin";

  if (!allow) {
    return (
      <div className="min-h-screen bg-[#FFEDCC] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
              <RestaurantsProvider>
                <EvaluatorsProvider>
                  <AssignedProvider>{children}</AssignedProvider>
                </EvaluatorsProvider>
              </RestaurantsProvider>
            </main>
          </div>
        </div>
      </PushNotificationsProvider>
    </UserProvider>
  );
}
