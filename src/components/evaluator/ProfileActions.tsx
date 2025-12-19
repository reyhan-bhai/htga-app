interface ProfileActionsProps {
  onEditProfile: () => void;
  onLogout: () => Promise<void>;
}

export const ProfileActions: React.FC<ProfileActionsProps> = ({
  onEditProfile,
  onLogout,
}) => {
  return (
    <div className="w-full max-w-xs space-y-3">
      {/* Update Profile Button */}
      <button
        onClick={onEditProfile}
        className="w-full bg-gradient-to-r from-[#ffa200] to-[#ff6b00] hover:bg-[#FF9500] text-white font-semibold py-4 rounded-full htga-button transition-colors"
      >
        Update Profile
      </button>

      {/* Logout Button */}
      <button
        onClick={onLogout}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 rounded-full htga-button transition-colors"
      >
        Logout Account
      </button>
    </div>
  );
};
