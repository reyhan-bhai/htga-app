"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { AiOutlineBell } from "react-icons/ai";

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();

  const handleEditProfile = () => {
    alert("Edit Profile functionality - Coming Soon!");
  };

  const handleBack = () => {
    router.push("/htga/dashboard");
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Header with Notification */}
      <div className="bg-cream pt-12 pb-6 px-6">
        <div className="flex justify-between items-center">
          <button
            onClick={handleBack}
            className="text-[#1B1B1B] text-sm font-medium"
          >
            ← Back
          </button>
          <button className="relative">
            <AiOutlineBell className="text-2xl text-[#1B1B1B]" />
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
                alt={user.name}
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
          className="w-full max-w-xs bg-[#FFA200] hover:bg-[#FF9500] text-white font-semibold py-4 rounded-full htga-button"
        >
          Edit Profile
        </button>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-black"></div>
    </div>
  );
}
