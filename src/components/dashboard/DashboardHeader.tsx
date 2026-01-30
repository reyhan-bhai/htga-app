import Link from "next/link";
import { MdMenuBook } from "react-icons/md";

interface DashboardHeaderProps {
  user: any;
  ndaSigned: boolean;
  notificationEnabled: boolean;
  onToggleNotification: () => void;
  onProfileClick: () => void;
  onNotificationsClick: () => void;
}

export default function DashboardHeader({
  user,
  ndaSigned,
  notificationEnabled,
  onToggleNotification,
  onProfileClick,
}: DashboardHeaderProps) {
  return (
    <div className="bg-white shadow-sm pt-12 pb-6 px-6 rounded-b-3xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-gray-500 text-sm font-medium">Welcome back,</p>
          <h2 className="text-2xl font-bold text-gray-900">
            {user?.name || "Evaluator"}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/user/handbook"
            className="p-2 rounded-full bg-gray-100 hover:bg-orange-100 transition-colors"
            title="Evaluator Handbook"
          >
            <MdMenuBook className="w-6 h-6 text-gray-700" />
          </Link>

          <button onClick={onProfileClick} className="relative">
            <div className="w-10 h-10 rounded-full bg-[#FFA200] flex items-center justify-center text-white font-bold shadow-md">
              {user?.name?.charAt(0).toUpperCase() || "E"}
            </div>
          </button>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex gap-3 mb-2 overflow-x-auto pb-2">
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${ndaSigned ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
        >
          {/* ... (NDA SVG) ... */}
          <span>{ndaSigned ? "NDA Signed" : "NDA Pending"}</span>
        </div>

        <button
          onClick={onToggleNotification}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${notificationEnabled ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-600"}`}
        >
          {/* ... (Notif SVG) ... */}
          <span>{notificationEnabled ? "Notif On" : "Notif Off"}</span>
        </button>
      </div>
    </div>
  );
}
