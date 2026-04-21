import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { PendingCourse } from '@/hooks/useCourseApprovalQueue';

type ApprovalRowProps = {
  course: PendingCourse;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
};

export default function ApprovalRow({ course, onApprove, onReject }: ApprovalRowProps) {
  const creator = course.profiles?.display_name ?? 'אמן';
  const isRejected = course.approval_status === 'rejected';

  const confirmReject = () => {
    Alert.alert(
      'לדחות את הקורס?',
      `הקורס "${course.title}" לא יפורסם תחת המקום שלך עד אישור עתידי.`,
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'דחייה',
          style: 'destructive',
          onPress: () => { void onReject(course.id); },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.title}>{course.title}</Text>
        <Text style={styles.meta}>
          {creator}
          {course.dance_style ? ` • ${course.dance_style}` : ''}
        </Text>
        {isRejected && <Text style={styles.rejected}>נדחה</Text>}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, styles.approveBtn]}
          onPress={() => { void onApprove(course.id); }}
        >
          <Ionicons name="checkmark" size={16} color={Colors.background} />
          <Text style={styles.approveText}>אישור</Text>
        </TouchableOpacity>

        {!isRejected && (
          <TouchableOpacity
            style={[styles.btn, styles.rejectBtn]}
            onPress={confirmReject}
          >
            <Ionicons name="close" size={16} color={Colors.error} />
          </TouchableOpacity>
        )}
      </View>
    </View>
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
  actions: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  btn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  approveBtn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  approveText: {
    color: Colors.background,
    fontSize: 12,
    fontWeight: '700',
  },
  rejectBtn: {
    borderColor: Colors.error,
  },
});
