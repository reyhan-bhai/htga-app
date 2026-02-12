"use client";

import localFont from "next/font/local";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MdAdminPanelSettings, MdClose, MdLogout } from "react-icons/md";

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
});

interface SuperadminDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuperadminDrawer({
  isOpen,
  onClose,
}: SuperadminDrawerProps) {
  const pathname = usePathname();

  const normalize = (p: string) => p.replace(/\/$/, "");
  const isActive = (href: string) => {
    if (!pathname) return false;
    const path = normalize(pathname);
    const target = normalize(href);
    return path === target || path.startsWith(`${target}/`);
  };

  const navItemClass = (href: string) => {
    const base = `flex items-center gap-3 p-3 rounded ${poppins.className} font-semibold text-[16px] transition-all`;
    const active = isActive(href) ? "bg-white/30 text-gray-900" : "text-white";
    const hover = "hover:bg-white/30 hover:text-gray-900";
    return `${base} ${active} ${hover}`;
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-[#1D4ED8] to-[#2563EB] text-white flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div
          className={`p-6 text-2xl ${poppins.className} font-bold flex items-center justify-between gap-2`}
        >
          <div className="flex items-center gap-2">
            <Image
              src="/home-2.png"
              alt="HTGA Logo"
              width={30}
              height={30}
              className="object-contain"
            />
            HTGA Superadmin
          </div>

          <button
            className="md:hidden text-white hover:bg-white/20 rounded p-1"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <MdClose size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <Link
                href="/superadmin"
                className={navItemClass("/superadmin")}
                onClick={onClose}
              >
                <MdAdminPanelSettings size={24} />
                Admin Accounts
              </Link>
            </li>
          </ul>
        </nav>

        <div className="p-4">
          <button
            className={`w-full flex items-center gap-3 p-3 rounded ${poppins.className} font-semibold text-[16px] hover:bg-red-600 hover:text-white transition-all text-white`}
            aria-label="Log out"
          >
            <MdLogout size={24} />
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
}
