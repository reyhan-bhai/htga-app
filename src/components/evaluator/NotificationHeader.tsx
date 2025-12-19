interface NotificationHeaderProps {
  onBack: () => void;
}

export const NotificationHeader: React.FC<NotificationHeaderProps> = ({
  onBack,
}) => {
  return (
    <div className="bg-[#ffa200] pt-6 pb-6 px-6 relative">
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="text-black text-sm font-bold font-['Poppins']"
          aria-label="Back button"
        >
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
        </button>
        <h1 className="text-black text-xl font-bold font-['Poppins']">Notification</h1>
        <div></div>
      </div>
    </div>
  );
};
