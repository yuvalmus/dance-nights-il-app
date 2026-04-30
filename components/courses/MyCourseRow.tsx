import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import { MyCourse } from '@/hooks/useMyCourses';

type Props = {
  course: MyCourse;
  /**
   * Venue the current user owns. Only the owner of THIS course's hosting
   * venue can approve it — a user who owns a different venue must fall
   * through to the regular details route.
   */
  ownedVenueId?: string;
  /**
   * Creator-only mutation hooks. When the viewer is the course creator we
   * surface inline edit/publish/delete actions, mirroring VenueEventRow.
   */
  onTogglePublish?: (courseId: string, currentlyPublished: boolean) => Promise<void>;
  onDelete?: (courseId: string) => Promise<void>;
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function formatRange(dates: string[]): string {
  if (dates.length === 0) return '';
  const sorted = [...dates].sort();
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  return first === last ? formatDate(first) : `${formatDate(first)} – ${formatDate(last)}`;
}

export default function MyCourseRow({
  course,
  ownedVenueId,
  onTogglePublish,
  onDelete,
}: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const isPending = course.approval_status === 'pending_owner_review';
  const isRejected = course.approval_status === 'rejected';
  const canApprove = !!ownedVenueId && course.venue_id === ownedVenueId;
  const isCreator = !!user && course.created_by === user.id;
  // Pending courses cannot be edited — only deleted — until the venue
  // owner answers. Approved/not_required/rejected can be edited freely.
  const canEdit = isCreator && !isPending;
  // Publish toggle only makes sense once the course is publishable.
  // Pending and rejected rows can't be shown publicly, so hide the eye.
  const canTogglePublish = isCreator && !isPending && !isRejected;

  const openDetails = () => {
    // Owner of the hosting venue reviewing an unresolved submission → approval screen.
    if (canApprove && (isPending || isRejected)) {
      router.push({ pathname: '/course/approve', params: { courseId: course.id } });
      return;
    }
    router.push({ pathname: '/course/details', params: { courseId: course.id } });
  };

  const handleEdit = () => {
    router.push({ pathname: '/course/edit', params: { courseId: course.id } });
  };

  const handleTogglePublish = () => {
    if (!onTogglePublish) return;
    onTogglePublish(course.id, course.is_published);
  };

  const handleDelete = () => {
    if (!onDelete) return;
    Alert.alert(
      'מחיקת קורס',
      `למחוק את "${course.title}"?`,
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: () => onDelete(course.id),
        },
      ],
    );
  };

  const dateRange = formatRange(course.course_schedules.map((s) => s.date));
  // Surface the artist name to the venue owner viewing someone else's course.
  const showCreatorName = !isCreator && !!course.creator_display_name;

  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.info} activeOpacity={0.7} onPress={openDetails}>
        <Text style={styles.title} numberOfLines={1}>{course.title}</Text>
        <View style={styles.meta}>
          {dateRange ? <Text style={styles.dateText}>{dateRange}</Text> : null}
          {showCreatorName && (
            <Text style={styles.creatorName} numberOfLines={1}>
              {course.creator_display_name}
            </Text>
          )}
          {isPending && <Text style={styles.statusPending}>ממתין לאישור</Text>}
          {isRejected && <Text style={styles.statusRejected}>נדחה</Text>}
          {isCreator && !isPending && !isRejected && (
            <View style={styles.statusGroup}>
              <View style={[styles.dot, course.is_published ? styles.dotPublished : styles.dotHidden]} />
              <Text style={styles.statusMuted}>
                {course.is_published ? 'מפורסם' : 'מוסתר'}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {isCreator ? (
        <View style={styles.actions}>
          {canEdit && (
            <TouchableOpacity onPress={handleEdit} hitSlop={8} style={styles.actionBtn}>
              <Ionicons name="pencil" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
          {onTogglePublish && canTogglePublish && (
            <TouchableOpacity onPress={handleTogglePublish} hitSlop={8} style={styles.actionBtn}>
              <Ionicons
                name={course.is_published ? 'eye' : 'eye-off'}
                size={16}
                color={course.is_published ? Colors.success : Colors.textMuted}
              />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity onPress={handleDelete} hitSlop={8} style={styles.actionBtn}>
              <Ionicons name="trash-outline" size={16} color={Colors.error} />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <Ionicons name="chevron-back" size={18} color={Colors.textMuted} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  info: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  meta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  dateText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  creatorName: {
    color: Colors.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
  },
  statusPending: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  statusRejected: {
    color: Colors.error,
    fontSize: 11,
    fontWeight: '700',
  },
  statusGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  statusMuted: {
    color: Colors.textMuted,
    fontSize: 11,
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
  actions: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    padding: 4,
  },
});
