interface ProfileHeaderProps {
  onBack: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ onBack }) => {
  return (
    <div className="pt-12 pb-6 px-6 relative">
      <div className="flex justify-center items-center">
        <h1 className="text-black text-xl font-bold font-['Poppins'] leading-7">
          My Profile
        </h1>
      </div>
      <div className="absolute left-6 top-12">
        <button onClick={onBack} className="text-black text-sm font-medium">
          <div className="size-8 relative">
            <div className="size-[26.67px] left-[0.67px] rounded-md absolute outline outline-[1.50px] outline-offset-[-0.75px] outline-[#292d32]" />
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </div>
        </button>
      </div>
    </div>
  );
};
