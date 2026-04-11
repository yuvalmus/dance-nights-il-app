import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { DanceLevel, DANCE_STYLE_LABELS } from '@/constants/config';
import DanceLevelBadge from '@/components/ui/DanceLevelBadge';

type Props = {
  danceStyles: string[];
  levelBadges: (DanceLevel | null)[];
  accentColor: string;
  hasShelter?: boolean;
};

export function BadgeRow({ danceStyles, levelBadges, accentColor, hasShelter }: Props) {
  return (
    <View style={styles.row}>
      {danceStyles.map((danceStyle) => (
        <View key={danceStyle} style={[styles.badge, styles.styleBadge]}>
          <Text style={styles.badgeText}>
            {DANCE_STYLE_LABELS[danceStyle as keyof typeof DANCE_STYLE_LABELS] ?? danceStyle}
          </Text>
        </View>
      ))}
      {levelBadges.map((level, i) => (
        <View key={level ?? 'open'} style={[styles.badge, styles.levelBadge]}>
          <DanceLevelBadge level={level} mode="icon" size="sm" pressable />
        </View>
      ))}
      {hasShelter && (
        <View style={[styles.badge, styles.shelterBadge]}>
          <Text style={[styles.badgeText, { color: '#22c55e' }]}>🛡️ מקלט</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 14,
    marginTop: 8,
    paddingBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  styleBadge: {
    backgroundColor: Colors.primary,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  levelBadge: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: `${Colors.primary}50`,
  },
  shelterBadge: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)',
  },
});
