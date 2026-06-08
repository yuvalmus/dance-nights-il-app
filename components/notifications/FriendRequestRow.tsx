import { useState } from 'react';
import { Alert } from 'react-native';
import {
  acceptFriendRequest,
  declineFriendRequest,
} from '@/lib/notificationService';
import NotificationRowBase from './NotificationRowBase';
import InlineActionButton from './InlineActionButton';
import { NotificationFeedRow } from '@/types/database';

type Props = {
  notification: NotificationFeedRow;
  onResolved: () => void;
};

export default function FriendRequestRow({ notification, onResolved }: Props) {
  const [busy, setBusy] = useState<'accept' | 'decline' | null>(null);
  const requesterId = (notification.data as { requester_id?: string })?.requester_id;

  const handleAction = async (
    kind: 'accept' | 'decline',
    runner: () => Promise<void>,
  ) => {
    if (!requesterId || busy) return;
    setBusy(kind);
    try {
      await runner();
      onResolved();
    } catch (err) {
      console.error('FriendRequestRow:', err);
      Alert.alert('שגיאה', 'הפעולה נכשלה. נסה שוב.');
    } finally {
      setBusy(null);
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
      actions={
        <>
          <InlineActionButton
            label="אישור"
            variant="primary"
            loading={busy === 'accept'}
            onPress={() =>
              handleAction('accept', () =>
                acceptFriendRequest(requesterId!, notification.id),
              )
            }
          />
          <InlineActionButton
            label="דחייה"
            variant="secondary"
            loading={busy === 'decline'}
            onPress={() =>
              handleAction('decline', () =>
                declineFriendRequest(requesterId!, notification.id),
              )
            }
          />
        </>
      }
    />
  );
}
