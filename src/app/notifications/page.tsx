"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import { MobileLayoutWrapper } from "../layout-wrapper";


const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600"] });

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
};

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([
    {
      id: "n1",
      title: "New Task Assigned",
      body: "You have been assigned to evaluate Restaurant A: Nasi Lemak.",
      time: "13 Dec 2025, 09:12",
      unread: true,
    },
    {
      id: "n2",
      title: "Reminder: NDA Signed",
      body: "Thank you for signing the NDA. Please start your evaluations.",
      time: "12 Dec 2025, 17:45",
      unread: false,
    },
    {
      id: "n3",
      title: "System Notice",
      body: "Maintenance scheduled tomorrow at 02:00 AM.",
      time: "11 Dec 2025, 08:00",
      unread: false,
    },
  ]);

  const markRead = (id: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, unread: false } : it)));
  };

  const handleBack = () => router.push("/dashboard");

  return (
    <MobileLayoutWrapper>
    <div className={`min-h-screen bg-white p-6 ${poppins.className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1B1B1B]">Your Notification <br /> Here</h1>
          <p className="text-sm text-[#939393] mt-2">Short: New</p>
        </div>
        <div>
          <button aria-label="notifications" className="p-2 mx-0.5">
            <svg className="w-10 h-12 text-black" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.id} className={`p-4 rounded-lg bg-cream shadow-sm flex justify-between items-start gap-4 ${it.unread ? "border-2 border-[#FFA200]" : "border border-gray-200"}`}>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-[#1B1B1B]">{it.title}</h3>
                {it.unread && <span className="text-xs bg-[#FFA200] text-white px-2 py-0.5 rounded">New</span>}
              </div>
              <p className="text-sm text-[#666666] mt-1">{it.body}</p>
              <p className="text-xs text-[#9B9B9B] mt-2">{it.time}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={() => markRead(it.id)}
                className="text-sm bg-[#FFA200] font-medium px-3 py-2 rounded text-white border border-[#FFA200] hover:bg-[#FF8C00] hover:text-white transition-all"
              >
                Mark Read
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <button onClick={handleBack} className="bg-[#FFA200] text-black px-6 py-3 rounded-lg shadow-md">Back</button>
      </div>
    </div>
    </MobileLayoutWrapper>
  );
}