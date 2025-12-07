import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Poppins } from "next/font/google";
import { MdAssignment, MdRestaurant, MdPeople, MdLogout } from "react-icons/md";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], 
});
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`flex h-screen bg-[#FFEDCC]`}>
      <aside className="w-2xl bg-gradient-to-b from-[#FF6B00] to-[#FFA200] text-white flex flex-col">
        <div className={`p-6 text-2xl ${poppins.className} font-bold flex items-center gap-2`}>
          {/* Add the logo here */}
          <Image 
            src="/home-2.png" 
            alt="HTGA Logo" 
            width={30} 
            height={30} 
            className="object-contain"
          />
          HTGA Admin
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <Link
                href="/admin/assigned"
                className={`flex items-center gap-3 p-3 rounded ${poppins.className} font-semibold text-[16px] hover:bg-white/30 transition-all`}
              >
                <MdAssignment size={24} />
                Assigned
              </Link>
            </li>
            <li>
              <Link
                href="/admin/restaurants"
                className={`flex items-center gap-3 p-3 rounded ${poppins.className} font-semibold text-[16px] hover:bg-white/30 transition-all`}
              >
                <MdRestaurant size={24} />
                Restaurant Management
              </Link>
            </li>
            <li>
              <Link
                href="/admin/evaluators"
                className={`flex items-center gap-3 p-3 rounded ${poppins.className} font-semibold text-[16px] hover:bg-white/30 transition-all`}
              >
                <MdPeople size={24} />
                Evaluator Management
              </Link>
            </li>
          </ul>
        </nav>
        <div className="p-4">
          <button className={`w-full flex items-center gap-3 p-3 rounded ${poppins.className} font-semibold text-[16px] hover:bg-white/30 transition-all text-white`}>
            <MdLogout size={24} />
            Log Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
