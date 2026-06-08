import { useRouter } from 'expo-router';
import NotificationRowBase from './NotificationRowBase';
import { NotificationFeedRow } from '@/types/database';
import { resolveNotificationRoute } from '@/lib/notificationRouting';

type Props = {
  notification: NotificationFeedRow;
  onMarkRead: (id: string) => void;
};

/**
 * Generic tap-to-navigate row. Used for non-actionable info notifications:
 * course approved/rejected, event date changed, registration spike,
 * favourite-venue/artist alerts, reminders, etc.
 */
export default function NotificationLinkRow({ notification, onMarkRead }: Props) {
  const router = useRouter();

  const handlePress = () => {
    onMarkRead(notification.id);
    const route = resolveNotificationRoute(notification);
    if (route) router.push(route as any);
  };

  return (
    <NotificationRowBase
      id={notification.id}
      type={notification.type}
      title={notification.title}
      body={notification.body}
      sortAt={notification.sort_at}
      unread={notification.read_at === null}
      onPress={handlePress}
    />
  );
}
