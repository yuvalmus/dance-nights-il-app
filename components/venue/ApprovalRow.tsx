import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { PendingCourse } from '@/hooks/useCourseApprovalQueue';

type ApprovalRowProps = {
  course: PendingCourse;
};

/**
 * Single-tap row that opens the course approval screen. Approve/reject
 * actions live on that detail screen — we deliberately don't surface them
 * here so the owner always sees what they're deciding on.
 */
export default function ApprovalRow({ course }: ApprovalRowProps) {
  const router = useRouter();
  const creator = course.profiles?.display_name ?? 'אמן';
  const isRejected = course.approval_status === 'rejected';

  const openDetails = () => {
    router.push({ pathname: '/course/approve', params: { courseId: course.id } });
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={openDetails}
      activeOpacity={0.7}
    >
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{course.title}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {creator}
          {course.dance_style ? ` • ${course.dance_style}` : ''}
        </Text>
        {isRejected && <Text style={styles.rejected}>נדחה</Text>}
      </View>

      {/* Chevron points "into" the screen (RTL: left) — a familiar
          "tap to drill in" affordance used across iOS list rows. */}
      <Ionicons name="chevron-back" size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
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
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  rejected: {
    color: Colors.error,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
