import { NotificationFeedRow } from '@/types/database';
import FriendsGoingRow from './FriendsGoingRow';
import FriendRequestRow from './FriendRequestRow';
import CoursePendingRow from './CoursePendingRow';
import InstructorInviteRow from './InstructorInviteRow';
import NotificationLinkRow from './NotificationLinkRow';

type Props = {
  notification: NotificationFeedRow;
  onMarkRead: (id: string) => void;
  /** Called after an inline action resolves so the feed can refetch. */
  onActionResolved: () => void;
};

/**
 * Per-type dispatcher. Keeps the FlatList renderItem trivial — every
 * notification type that warrants its own UI gets a dedicated component,
 * and everything else falls through to the generic tap-to-navigate row.
 */
export default function NotificationListItem({
  notification,
  onMarkRead,
  onActionResolved,
}: Props) {
  switch (notification.type) {
    case 'friend_request':
      return <FriendRequestRow notification={notification} onResolved={onActionResolved} />;

    case 'course_pending_approval':
      return <CoursePendingRow notification={notification} onResolved={onActionResolved} />;

    case 'instructor_invite':
      return <InstructorInviteRow notification={notification} onResolved={onActionResolved} />;

    case 'friends_going':
    case 'friend_going_event':
    case 'friend_going_course':
      return <FriendsGoingRow notification={notification} onMarkRead={onMarkRead} />;

    default:
      return <NotificationLinkRow notification={notification} onMarkRead={onMarkRead} />;
  }
}
