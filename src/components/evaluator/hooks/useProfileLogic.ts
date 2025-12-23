import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export const useProfileLogic = () => {
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

  return {
    user,
    handleEditProfile,
    handleBack,
    handleLogout,
  };
};
