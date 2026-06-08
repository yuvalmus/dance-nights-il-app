import { useRouter } from 'expo-router';
import SocialAvatarRow from '@/components/social/SocialAvatarRow';
import NotificationRowBase from './NotificationRowBase';
import { FriendsGoingData, NotificationFeedRow } from '@/types/database';

type Props = {
  notification: NotificationFeedRow;
  onMarkRead: (id: string) => void;
};

/**
 * Aggregated "friends going" row. Avatars are stand-in dancers (no photo
 * data in the payload); the body string is built by the DB so the row only
 * has to render what it receives.
 */
export default function FriendsGoingRow({ notification, onMarkRead }: Props) {
  const router = useRouter();
  const data = notification.data as unknown as Partial<FriendsGoingData>;
  const friendCount = Array.isArray(data.actors) ? data.actors.length : 0;

  const handlePress = () => {
    onMarkRead(notification.id);
    if (data.activity_kind === 'event' && data.activity_id) {
      router.push({ pathname: '/', params: { eventId: data.activity_id } });
    } else if (data.activity_kind === 'course' && data.activity_id) {
      router.push({ pathname: '/course/details', params: { courseId: data.activity_id } });
    }
  };

  return (
    <NotificationRowBase
      id={notification.id}
      type={notification.type}
      title={notification.title}
      body={notification.body}
      sortAt={notification.sort_at}
      unread={notification.read_at === null}
      leading={<SocialAvatarRow friendCount={friendCount} />}
      onPress={handlePress}
    />
  );
}
