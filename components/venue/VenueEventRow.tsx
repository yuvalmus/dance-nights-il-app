import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { EventWithSchedules } from '@/hooks/useVenue';
import { formatTime } from '@/lib/date';

type VenueEventRowProps = {
  event: EventWithSchedules;
  onTogglePublish?: (eventId: string, isPublished: boolean) => Promise<void>;
  onDelete?: (eventId: string) => Promise<void>;
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDate();
  const month = date.getMonth() + 1;
  return `${day}/${month}`;
}

export default function VenueEventRow({ event, onTogglePublish, onDelete }: VenueEventRowProps) {
  const router = useRouter();

  const isPast = new Date(event.date + 'T23:59:59') < new Date();

  const handleEdit = () => {
    router.push({ pathname: '/venue/edit-event', params: { eventId: event.id } });
  };

  const handleDuplicate = () => {
    const duplicateData = JSON.stringify({
      title: event.title,
      description: event.description || '',
      dance_styles: event.dance_styles,
      schedules: event.event_schedules
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((s) => ({
          time: formatTime(s.time),
          description: s.description,
          level: s.level || '',
        })),
      price: event.price != null ? String(event.price) : '',
      price_note: event.price_note || '',
      dj: event.dj || '',
      instructors: event.instructors,
      is_published: false,
    });

    router.push({ pathname: '/venue/add-event', params: { duplicate: duplicateData } });
  };

  const handleDelete = () => {
    Alert.alert(
      'מחיקת אירוע',
      `למחוק את "${event.title}"?`,
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: onDelete && (() => onDelete(event.id)),
        },
      ],
    );
  };

  const handleTogglePublish = () => {
    onTogglePublish && onTogglePublish(event.id, event.is_published);
  };

  return (
    <View style={[styles.row, isPast && styles.rowPast]}>
      {/* Content (right side) */}
      <View style={styles.content}>
        <Text style={[styles.title, isPast && styles.textPast]} numberOfLines={1}>
          {event.title}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.date, isPast && styles.textPast]}>
            {formatDate(event.date)}
          </Text>
          {onTogglePublish && (
            <View style={styles.statusGroup}>
              <View style={[styles.dot, event.is_published ? styles.dotPublished : styles.dotHidden]} />
              <Text style={styles.status}>
                {event.is_published ? 'מפורסם' : 'מוסתר'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Actions (left side) — edit, publish toggle, delete */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={handleEdit} hitSlop={8} style={styles.actionBtn}>
          <Ionicons name="pencil" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDuplicate} hitSlop={8} style={styles.actionBtn}>
          <Ionicons name="copy-outline" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>
        {onTogglePublish && (
          <TouchableOpacity onPress={handleTogglePublish} hitSlop={8} style={styles.actionBtn}>
          <Ionicons
            name={event.is_published ? 'eye' : 'eye-off'}
            size={16}
            color={event.is_published ? Colors.success : Colors.textMuted}
          />
        </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity onPress={handleDelete} hitSlop={8} style={styles.actionBtn}>
          <Ionicons name="trash-outline" size={16} color={Colors.error} />
        </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowPast: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  textPast: {
    color: Colors.textMuted,
  },
  meta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },
  statusGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  date: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotPublished: {
    backgroundColor: Colors.success,
  },
  dotHidden: {
    backgroundColor: Colors.textMuted,
  },
  status: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    padding: 4,
  },
});
