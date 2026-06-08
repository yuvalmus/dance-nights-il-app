import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { Notification, NotificationType } from '@/types/database';

type NotificationRowProps = {
  notification: Notification;
  onPress: (id: string) => void;
};

// Plan keeps this centralised — adding a new type means one lookup table
// edit rather than branching throughout the UI.
const ICON_BY_TYPE: Record<NotificationType, keyof typeof ICONS> = {
  instructor_left_venue: 'person-remove',
  instructor_invite: 'mail',
  course_pending_approval: 'clipboard',
  course_approved: 'checkmark-circle',
  course_rejected: 'close-circle',
  friend_request: 'person-add',
  friend_accepted: 'checkmark-circle',
  friend_going_event: 'people',
  friend_going_course: 'people',
  event_date_changed: 'calendar',
};
const ICONS = {
  'person-remove': 'person-remove-outline',
  mail: 'mail-outline',
  clipboard: 'clipboard-outline',
  'checkmark-circle': 'checkmark-circle-outline',
  'close-circle': 'close-circle-outline',
  'person-add': 'person-add-outline',
  people: 'people-outline',
  calendar: 'calendar-outline',
} as const;

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'זה עתה';
  if (mins < 60) return `לפני ${mins} ד'`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `לפני ${hours} שעות`;
  const days = Math.floor(hours / 24);
  return `לפני ${days} ימים`;
}

export default function NotificationRow({ notification, onPress }: NotificationRowProps) {
  const unread = notification.read_at === null;
  const iconName = ICONS[ICON_BY_TYPE[notification.type] ?? 'mail'];

  return (
    <TouchableOpacity
      style={[styles.container, unread && styles.unread]}
      onPress={() => onPress(notification.id)}
    >
      <Ionicons name={iconName as any} size={20} color={unread ? Colors.primary : Colors.textSecondary} />

      <View style={styles.body}>
        <Text style={[styles.title, unread && styles.titleUnread]}>
          {notification.title}
        </Text>
        {notification.body && (
          <Text style={styles.message}>{notification.body}</Text>
        )}
        <Text style={styles.time}>{formatTime(notification.created_at)}</Text>
      </View>

      {unread && <View style={styles.dot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  unread: {
    backgroundColor: Colors.surfaceLight,
  },
  body: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },
  titleUnread: {
    fontWeight: '700',
  },
  message: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
    textAlign: 'right',
  },
  time: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 6,
  },
});
