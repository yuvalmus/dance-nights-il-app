import { useState } from 'react';
import { Alert } from 'react-native';
import {
  approvePendingCourse,
  rejectPendingCourse,
} from '@/lib/notificationService';
import NotificationRowBase from './NotificationRowBase';
import InlineActionButton from './InlineActionButton';
import { NotificationFeedRow } from '@/types/database';

type Props = {
  notification: NotificationFeedRow;
  onResolved: () => void;
};

export default function CoursePendingRow({ notification, onResolved }: Props) {
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
  const courseId = (notification.data as { course_id?: string })?.course_id;

  const runAction = async (kind: 'approve' | 'reject', runner: () => Promise<void>) => {
    if (!courseId || busy) return;
    setBusy(kind);
    try {
      await runner();
      onResolved();
    } catch (err) {
      console.error('CoursePendingRow:', err);
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
            label="אשר"
            variant="primary"
            loading={busy === 'approve'}
            onPress={() =>
              runAction('approve', () => approvePendingCourse(courseId!, notification.id))
            }
          />
          <InlineActionButton
            label="דחייה"
            variant="secondary"
            loading={busy === 'reject'}
            onPress={() =>
              runAction('reject', () => rejectPendingCourse(courseId!, notification.id))
            }
          />
        </>
      }
    />
  );
}
