import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export const useProfileLogic = () => {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleEditProfile = () => {
    alert("Edit Profile functionality - Coming Soon!");
  };

  const handleBack = () => {
    router.push("/user/dashboard");
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return {
    user,
    handleEditProfile,
    handleBack,
    handleLogout,
  };
};
