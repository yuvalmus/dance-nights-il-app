import { View, Text, Linking, StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Colors } from '@/constants/colors';
import { RegistrationLink } from '@/types/database';
import { SpotsBar, getUrgency } from '@/components/ui/SpotsBar';

type Props = {
  link: RegistrationLink;
  accentColor: string;
};

export default function RegistrationLinkSlide({ link, accentColor }: Props) {
  const hasSpots = link.spots_total != null && link.spots_total > 0;
  const urgency = hasSpots ? getUrgency(link.spots_total!, link.spots_taken) : 'calm';
  const isClosed = urgency === 'closed';

  return (
    <View style={styles.container}>
      {link.label ? (
        <Text style={styles.label}>{link.label}</Text>
      ) : null}

      {hasSpots && (
        <SpotsBar total={link.spots_total!} taken={link.spots_taken} />
      )}

      <TouchableOpacity
        style={[
          styles.cta,
          { backgroundColor: isClosed ? Colors.textMuted : accentColor },
        ]}
        onPress={() => !isClosed && Linking.openURL(link.url)}
        disabled={isClosed}
        activeOpacity={0.7}
      >
        <Text style={styles.ctaText}>
          {isClosed ? 'הרשמה נסגרה' : 'הרשמה ←'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
  },
  label: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 6,
  },
  cta: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  ctaText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
});
