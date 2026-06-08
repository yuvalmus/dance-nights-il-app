import { useState } from 'react';
import { Alert } from 'react-native';
import {
  acceptInstructorInvite,
  declineInstructorInvite,
} from '@/lib/notificationService';
import NotificationRowBase from './NotificationRowBase';
import InlineActionButton from './InlineActionButton';
import { NotificationFeedRow } from '@/types/database';

type Props = {
  notification: NotificationFeedRow;
  onResolved: () => void;
};

export default function InstructorInviteRow({ notification, onResolved }: Props) {
  const [busy, setBusy] = useState<'accept' | 'decline' | null>(null);
  const affiliationId = (notification.data as { affiliation_id?: string })?.affiliation_id;

  const runAction = async (
    kind: 'accept' | 'decline',
    runner: () => Promise<void>,
  ) => {
    if (!affiliationId || busy) return;
    setBusy(kind);
    try {
      await runner();
      onResolved();
    } catch (err) {
      console.error('InstructorInviteRow:', err);
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
            label="קבל"
            variant="primary"
            loading={busy === 'accept'}
            onPress={() =>
              runAction('accept', () =>
                acceptInstructorInvite(affiliationId!, notification.id),
              )
            }
          />
          <InlineActionButton
            label="דחה"
            variant="secondary"
            loading={busy === 'decline'}
            onPress={() =>
              runAction('decline', () =>
                declineInstructorInvite(affiliationId!, notification.id),
              )
            }
          />
        </>
      }
    />
  );
}
