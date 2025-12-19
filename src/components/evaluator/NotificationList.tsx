import { NotificationItem } from "./hooks/useNotificationsLogic";
import { NotificationCard } from "./NotificationCard";

interface NotificationListProps {
  notifications: {
    today: NotificationItem[];
    thisWeek: NotificationItem[];
  };
  onRemove: (id: string) => void;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  onRemove,
}) => {
  return (
    <div className="mt-8 px-6 pb-8">
      {/* TODAY Section */}
      {notifications.today.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">
            TODAY
          </h2>
          <div className="space-y-3">
            {notifications.today.map((notif) => (
              <NotificationCard
                key={notif.id}
                notification={notif}
                onRemove={onRemove}
              />
            ))}
          </div>
        </div>
      )}

      {/* THIS WEEK Section */}
      {notifications.thisWeek.length > 0 && (
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">
            This Week
          </h2>
          <div className="space-y-3">
            {notifications.thisWeek.map((notif) => (
              <NotificationCard
                key={notif.id}
                notification={notif}
                onRemove={onRemove}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {notifications.today.length === 0 && notifications.thisWeek.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No notifications yet</p>
        </div>
      )}
    </div>
  );
};
