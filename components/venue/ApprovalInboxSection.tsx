import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { useCourseApprovalQueue } from '@/hooks/useCourseApprovalQueue';
import ApprovalRow from './ApprovalRow';

type ApprovalInboxSectionProps = {
  venueId: string;
};

/**
 * Owner's inbox of courses hosted at their venue awaiting publish approval.
 * Separate section — the owner may have both events (they create) and
 * pending artist courses (they approve). Mixing the two confuses the mental
 * model, so the section visibly calls out the approval gate.
 */
export default function ApprovalInboxSection({ venueId }: ApprovalInboxSectionProps) {
  const { pending, rejected, loading } = useCourseApprovalQueue(venueId);

  if (loading) return null;
  if (pending.length === 0 && rejected.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="clipboard-outline" size={18} color={Colors.primary} />
        <Text style={styles.title}>קורסים ממתינים לאישור</Text>
      </View>

      {pending.length > 0 && (
        <View style={styles.group}>
          <Text style={styles.groupTitle}>ממתינים ({pending.length})</Text>
          {pending.map((course) => (
            <ApprovalRow key={course.id} course={course} />
          ))}
        </View>
      )}

      {rejected.length > 0 && (
        <View style={styles.group}>
          <Text style={styles.groupTitle}>נדחו</Text>
          {rejected.map((course) => (
            <ApprovalRow key={course.id} course={course} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  title: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  group: {
    marginTop: 4,
  },
  groupTitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 4,
  },
});
