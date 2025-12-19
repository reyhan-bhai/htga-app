import { NotificationItem } from "./hooks/useNotificationsLogic";
import { useState } from "react";

interface NotificationCardProps {
  notification: NotificationItem;
  onRemove: (id: string) => void;
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case "evaluation":
      return "bg-red-500";
    case "nda":
      return "bg-[#FFA200]";
    default:
      return "bg-gray-400";
  }
};

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onRemove,
}) => {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(notification.id);
    }, 300);
  };

  return (
    <div
      className={`transform transition-all duration-300 ${
        isRemoving ? "opacity-0 translate-x-full" : "opacity-100 translate-x-0"
      }`}
    >
      <div
        className={`p-4 rounded-xl shadow-md flex gap-4 ${
          notification.category === "evaluation" ? "bg-red-50" : "bg-orange-50"
        }`}
      >
        {/* Left border indicator */}
        <div
          className={`w-1 rounded-full ${getCategoryColor(notification.category)}`}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3
              className={`font-bold text-sm truncate ${
                notification.category === "evaluation"
                  ? "text-red-600"
                  : "text-[#FFA200]"
              }`}
            >
              {notification.title}
            </h3>
            <p className="text-xs text-gray-500 flex-shrink-0">{notification.time}</p>
          </div>

          <p className="text-sm text-gray-700 mt-1 line-clamp-2">
            {notification.body}
          </p>
        </div>

        {/* Remove button */}
        <button
          onClick={handleRemove}
          className="text-gray-400 hover:text-red-500 flex-shrink-0 p-1 transition-colors"
          aria-label="Remove notification"
          title="Remove notification"
        >
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
          </svg>
        </button>
      </div>
    </div>
  );
};
