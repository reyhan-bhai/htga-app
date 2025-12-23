interface User {
  avatar?: string;
  name?: string;
}

interface ProfileAvatarProps {
  user: User | null;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ user }) => {
  return (
    <div className="flex flex-col items-center">
      <div className="relative mb-8">
        <div className="w-40 h-40 rounded-full bg-gradient-2 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt="Profile Avatar"
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
    </div>
  );
};
