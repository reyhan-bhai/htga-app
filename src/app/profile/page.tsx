"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "../../htga-app/context/AuthContext";
import { MobileLayoutWrapper } from "../layout-wrapper";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleEditProfile = () => {
    alert("Edit Profile functionality - Coming Soon!");
  };

  const handleBack = () => {
    router.push("/dashboard");
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <MobileLayoutWrapper>
      <div className="min-h-screen bg-cream">
        {/* Header with Notification */}
        <div className="bg-cream pt-12 pb-6 px-6">
        <div className="flex justify-between items-center">
          <button
            onClick={handleBack}
            className="text-[#1B1B1B] text-sm font-medium"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button className="relative">
            <svg className="w-6 h-6 text-[#1B1B1B]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center px-6 pt-8">
        {/* Profile Picture */}
        <div className="relative mb-8">
          <div className="w-40 h-40 rounded-full bg-gradient-2 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
            {user?.avatar ? (
              <img
                src={user.avatar}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-2 flex items-center justify-center">
                <span className="text-white text-5xl font-bold">
                  {user?.name?.charAt(0) || "E"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[#1B1B1B] mb-2">
            {user?.name || "Evaluator Name"}
          </h2>
          <p className="text-sm text-[#939393] mb-1">
            Username: {user?.username || "evaluator"}
          </p>
          <p className="text-sm text-[#939393]">
            Role: {user?.role || "Evaluator"}
          </p>
        </div>

        {/* Edit Profile Button */}
        <button
          onClick={handleEditProfile}
          className="w-full max-w-xs bg-[#FFA200] hover:bg-[#FF9500] text-white font-semibold py-4 rounded-full htga-button mb-4"
        >
          Edit Profile
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full max-w-xs bg-red-600 hover:bg-red-700 text-white font-semibold py-4 rounded-full htga-button"
        >
          Logout
        </button>
      </div>

        {/* Bottom Navigation Bar */}
        <div className="fixed bottom-0 left-0 right-0 h-1 bg-black"></div>
      </div>
    </MobileLayoutWrapper>
  );
}
