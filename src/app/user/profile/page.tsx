"use client";
import {
  ProfileActions,
  ProfileAvatar,
  ProfileDetails,
  ProfileHeader,
} from "@/components/evaluator";
import { useProfileLogic } from "@/components/evaluator/hooks/useProfileLogic";
import { MobileLayoutWrapper } from "../../layout-wrapper";

export default function ProfilePage() {
  const { user, handleEditProfile, handleBack, handleLogout } =
    useProfileLogic();

  return (
    <MobileLayoutWrapper>
      <div className="min-h-screen bg-cream flex flex-col">
        <div className="bg-[#FFA200] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] pb-8 rounded-b-1xl">
          {/* Header */}
          <ProfileHeader onBack={handleBack} />

          {/* Main Content */}
          <ProfileAvatar user={user} />
        </div>
        <div className="bg-cream mt-6 rounded-t-3xl flex-1">
          <div className="flex flex-col items-center px-6 pt-8 pb-8">
            {/* Avatar */}

            {/* Details */}

            <ProfileDetails user={user} />

            {/* Actions */}
            <div className="mt-8 w-full flex justify-center">
              <ProfileActions
                onEditProfile={handleEditProfile}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-black"></div>
    </MobileLayoutWrapper>
  );
}
