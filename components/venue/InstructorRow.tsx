import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { OwnerAffiliation } from '@/hooks/useVenueAffiliations';

type InstructorRowProps = {
  affiliation: OwnerAffiliation;
  onRevoke: (id: string) => Promise<void>;
};

export default function InstructorRow({ affiliation, onRevoke }: InstructorRowProps) {
  const name = affiliation.profiles?.display_name ?? 'מדריך';
  const isPending = affiliation.status === 'pending';

  const confirmRevoke = () => {
    Alert.alert(
      isPending ? 'לבטל את ההזמנה?' : `להסיר את ${name}?`,
      isPending
        ? 'ההזמנה תימחק. תמיד אפשר לשלוח שוב.'
        : 'המדריך לא יוצג יותר כשייך למקום.',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: isPending ? 'בטל הזמנה' : 'הסרה',
          style: 'destructive',
          onPress: () => { void onRevoke(affiliation.id); },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        {affiliation.profiles?.is_artist && (
          <View style={styles.badge}>
            <Ionicons name="checkmark-circle" size={12} color={Colors.primary} />
            <Text style={styles.badgeText}>אמן מאומת</Text>
          </View>
        )}
        {isPending && <Text style={styles.pendingLabel}>ממתין לאישור</Text>}
      </View>

      <TouchableOpacity style={styles.removeBtn} onPress={confirmRevoke}>
        <Ionicons
          name={isPending ? 'close-circle-outline' : 'trash-outline'}
          size={18}
          color={Colors.error}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  info: {
    flex: 1,
    alignItems: 'flex-end',
  },
  name: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  badgeText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  pendingLabel: {
    color: Colors.warning,
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  removeBtn: {
    padding: 6,
  },
});
