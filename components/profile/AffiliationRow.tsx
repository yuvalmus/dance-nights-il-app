import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { AffiliationWithVenue } from '@/hooks/useAffiliations';

type AffiliationRowProps = {
  affiliation: AffiliationWithVenue;
  onAccept?: (id: string) => Promise<void>;
  onDecline?: (id: string) => Promise<void>;
  onLeave?: (id: string) => Promise<void>;
};

export default function AffiliationRow({
  affiliation,
  onAccept,
  onDecline,
  onLeave,
}: AffiliationRowProps) {
  const venueName = affiliation.venues?.name ?? 'מקום';
  const isPending = affiliation.status === 'pending';

  const confirmLeave = () => {
    // Destructive confirm — plan explicitly asks for this to prevent misclicks.
    Alert.alert(
      `לסיים את השיוך ל${venueName}?`,
      'בעל המקום יקבל התראה שעזבת. תמיד אפשר לקבל הזמנה מחדש.',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'סיום שיוך',
          style: 'destructive',
          onPress: () => { void onLeave?.(affiliation.id); },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.venue}>{venueName}</Text>
        {affiliation.venues?.city && (
          <Text style={styles.city}>{affiliation.venues.city}</Text>
        )}
        {isPending && <Text style={styles.pendingLabel}>הזמנה חדשה</Text>}
      </View>

      <View style={styles.actions}>
        {isPending ? (
          <>
            <TouchableOpacity
              style={[styles.btn, styles.primaryBtn]}
              onPress={() => { void onAccept?.(affiliation.id); }}
            >
              <Text style={styles.primaryBtnText}>אישור</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.secondaryBtn]}
              onPress={() => { void onDecline?.(affiliation.id); }}
            >
              <Text style={styles.secondaryBtnText}>דחייה</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.btn, styles.leaveBtn]}
            onPress={confirmLeave}
          >
            <Ionicons name="exit-outline" size={16} color={Colors.error} />
            <Text style={styles.leaveBtnText}>סיים שיוך</Text>
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
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  info: {
    flex: 1,
    alignItems: 'flex-end',
  },
  venue: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  city: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  pendingLabel: {
    color: Colors.warning,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  btn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  primaryBtnText: {
    color: Colors.background,
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryBtn: {
    borderColor: Colors.border,
  },
  secondaryBtnText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  leaveBtn: {
    borderColor: Colors.error,
  },
  leaveBtnText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '600',
  },
});
