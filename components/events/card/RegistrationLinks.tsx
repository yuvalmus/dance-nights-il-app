import { View, Text, StyleSheet, Pressable } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { RegistrationLink } from '@/types/database';
import { getUrgency, getUrgencyColor } from '@/components/ui/SpotsBar';
import PagingCarousel from '@/components/ui/PagingCarousel';
import RegistrationLinkSlide from './RegistrationLinkSlide';

type Props = {
  links: RegistrationLink[];
  preRegister: boolean;
  price: number | null;
  priceNote: string | null;
  accentColor: string;
};

function getDotConfigs(links: RegistrationLink[]) {
  return links.map((link) => {
    const hasSpots = link.spots_total != null && link.spots_total > 0;
    const urgency = hasSpots ? getUrgency(link.spots_total!, link.spots_taken) : 'calm';
    return { color: getUrgencyColor(urgency) };
  });
}

export default function RegistrationLinks({ links, preRegister, price, priceNote, accentColor }: Props) {
  const renderContent = () => {
    if (links.length === 0) {
      return (
        <View style={styles.fallback}>
          <Text style={styles.fallbackText}>
            {preRegister ? 'הרשמה מראש נדרשת' : 'כניסה חופשית ✓'}
          </Text>
          {!preRegister && price != null && price > 0 && (
            <Text style={styles.priceText}>מחיר כניסה: ₪{price}</Text>
          )}
          {!preRegister && priceNote && (
            <Text style={styles.priceNote}>{priceNote}</Text>
          )}
        </View>
      );
    }

    if (links.length === 1) {
      return <RegistrationLinkSlide link={links[0]} accentColor={accentColor} />;
    }

    return (
      <PagingCarousel
        data={links}
        renderItem={(link) => (
          <RegistrationLinkSlide link={link} accentColor={accentColor} />
        )}
        dots={getDotConfigs(links)}
      />
    );
  };

  return (
    <Pressable onPress={(e) => e.stopPropagation()}>
      <TouchableOpacity
        style={styles.box}
        activeOpacity={1}
        onPress={() => {}}
        disallowInterruption={true}
      >
        <View style={styles.labelRow}>
          <Ionicons name="ticket-outline" size={12} color={Colors.textSecondary} />
          <Text style={styles.sectionLabel}> הרשמה</Text>
        </View>
        {renderContent()}
      </TouchableOpacity>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 12,
  },
  labelRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  fallback: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  fallbackText: {
    color: Colors.success,
    fontWeight: '700',
    fontSize: 14,
  },
  priceText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  priceNote: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
});
