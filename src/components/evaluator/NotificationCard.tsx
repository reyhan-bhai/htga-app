import { NotificationItem } from "./hooks/useNotificationsLogic";

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
}) => {
  return (
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
        <div className="flex items-center justify-between">
          <h3
            className={`font-bold text-sm truncate ${
              notification.category === "evaluation"
            ? "text-red-600"
            : "text-[#FFA200]"
            }`}
          >
            {notification.title}
          </h3>
          <p className="text-xs text-gray-500 ml-2">{notification.time}</p>
        </div>

        <p className="text-sm text-gray-700 mt-1 line-clamp-2">
          {notification.body}
        </p>
      </div>

      {/* Remove button */}
  
    </div>
  );
};
