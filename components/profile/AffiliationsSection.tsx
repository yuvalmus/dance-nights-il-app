import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { useAffiliations } from '@/hooks/useAffiliations';
import AffiliationRow from './AffiliationRow';

export default function AffiliationsSection() {
  const { pendingInvites, activeAffiliations, accept, decline, leave, loading } =
    useAffiliations();

  // Nothing to show — keep the profile clean for dancers with no affiliations.
  if (loading) return null;
  if (pendingInvites.length === 0 && activeAffiliations.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="people" size={20} color={Colors.primary} />
        <Text style={styles.sectionTitle}>שיוכים למקומות</Text>
      </View>

      {pendingInvites.length > 0 && (
        <View style={styles.group}>
          <Text style={styles.groupTitle}>הזמנות ממתינות</Text>
          {pendingInvites.map((aff) => (
            <AffiliationRow
              key={aff.id}
              affiliation={aff}
              onAccept={accept}
              onDecline={decline}
            />
          ))}
        </View>
      )}

      {activeAffiliations.length > 0 && (
        <View style={styles.group}>
          <Text style={styles.groupTitle}>אני מדריך/ה ב</Text>
          {activeAffiliations.map((aff) => (
            <AffiliationRow
              key={aff.id}
              affiliation={aff}
              onLeave={leave}
            />
          ))}
        </View>
      )}
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
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  group: {
    marginTop: 8,
  },
  groupTitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    marginTop: 8,
    marginBottom: 4,
  },
});
