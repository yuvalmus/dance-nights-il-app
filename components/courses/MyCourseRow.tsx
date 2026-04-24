import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { MyCourse } from '@/hooks/useMyCourses';

type Props = {
  course: MyCourse;
  /**
   * Venue the current user owns. Only the owner of THIS course's hosting
   * venue can approve it — a user who owns a different venue must fall
   * through to the regular details route.
   */
  ownedVenueId?: string;
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

export default function MyCourseRow({ course, ownedVenueId }: Props) {
  const router = useRouter();
  const isPending = course.approval_status === 'pending_owner_review';
  const isRejected = course.approval_status === 'rejected';
  const canApprove = !!ownedVenueId && course.venue_id === ownedVenueId;

  const openDetails = () => {
    // Owner of the hosting venue reviewing an unresolved submission → approval screen.
    if (canApprove && (isPending || isRejected)) {
      router.push({ pathname: '/course/approve', params: { courseId: course.id } });
      return;
    }
    router.push({ pathname: '/course/details', params: { courseId: course.id } });
  };

  const dateRange = formatRange(course.course_schedules.map((s) => s.date));

  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={openDetails}>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{course.title}</Text>
        <View style={styles.meta}>
          {dateRange ? <Text style={styles.dateText}>{dateRange}</Text> : null}
          {isPending && <Text style={styles.statusPending}>ממתין לאישור</Text>}
          {isRejected && <Text style={styles.statusRejected}>נדחה</Text>}
        </View>
      </View>
      <Ionicons name="chevron-back" size={18} color={Colors.textMuted} />
    </TouchableOpacity>
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
});
