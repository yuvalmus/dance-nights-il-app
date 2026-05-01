import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import { useVenueAffiliations } from '@/hooks/useVenueAffiliations';
import InstructorInvite from './InstructorInvite';
import InstructorRow from './InstructorRow';

type InstructorSectionProps = {
  venueId: string;
};

/**
 * Owner's view of instructors at their venue — active, pending, invite flow.
 * Top-level card on the profile screen; lifecycle lives in the hook,
 * rendering here.
 */
export default function InstructorSection({ venueId }: InstructorSectionProps) {
  const { user } = useAuth();
  const { active, pending, invite, revoke } = useVenueAffiliations(venueId);

  const excludeIds = useMemo(() => {
    const ids = new Set<string>();
    [...active, ...pending].forEach((a) => ids.add(a.user_id));
    return ids;
  }, [active, pending]);

  const handleInvite = async (userId: string) => {
    if (!user) return;
    await invite(userId, user.id);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="people-outline" size={22} color={Colors.primary} />
        <Text style={styles.title}>המדריכים שלי</Text>
      </View>

      {active.length === 0 && pending.length === 0 && (
        <Text style={styles.empty}>אין מדריכים משויכים. הזמן את הראשון.</Text>
      )}

      {pending.length > 0 && (
        <View style={styles.group}>
          <Text style={styles.groupTitle}>ממתינים לאישור</Text>
          {pending.map((aff) => (
            <InstructorRow key={aff.id} affiliation={aff} onRevoke={revoke} />
          ))}
        </View>
      )}

      {active.length > 0 && (
        <View style={styles.group}>
          <Text style={styles.groupTitle}>פעילים</Text>
          {active.map((aff) => (
            <InstructorRow key={aff.id} affiliation={aff} onRevoke={revoke} />
          ))}
        </View>
      )}

      <InstructorInvite excludeIds={excludeIds} onInvite={handleInvite} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  title: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  empty: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
  },
  group: {
    marginTop: 8,
  },
  groupTitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 4,
  },
});
