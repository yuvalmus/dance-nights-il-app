import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { Venue } from '@/types/database';
import { getVenueLogo } from '@/constants/venueLogos';

type Props = {
  venue: Venue;
};

/**
 * Profile-screen entry card for a venue owner. Replaces the old
 * MyVenueSection (which inlined the full event list) — clicking the
 * "ניהול המקום" button hands off to /profile/manage where events,
 * courses, and instructors live in tabs.
 */
export default function MyVenueCard({ venue }: Props) {
  const router = useRouter();
  const logo = getVenueLogo(venue.slug);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {logo ? (
          <Image source={logo} style={styles.logo} />
        ) : (
          <View style={[styles.logo, styles.logoPlaceholder]}>
            <Ionicons name="business" size={22} color={Colors.primary} />
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.label}>המקום שלי</Text>
          <Text style={styles.venueName}>{venue.name}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/profile/manage')}
        activeOpacity={0.8}
      >
        <Ionicons name="settings-outline" size={18} color={Colors.background} />
        <Text style={styles.buttonText}>ניהול המקום</Text>
      </TouchableOpacity>
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
    gap: 14,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  logoPlaceholder: {
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    alignItems: 'flex-end',
  },
  label: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  venueName: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 2,
  },
  button: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: Colors.background,
    fontSize: 15,
    fontWeight: '700',
  },
});
