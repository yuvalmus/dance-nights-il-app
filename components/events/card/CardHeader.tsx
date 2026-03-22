import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { EventWithVenue } from '@/types/database';
import { LiveBadge } from './LiveBadge';
import { QuickInfo } from './QuickInfo';
import { BadgeRow } from './BadgeRow';

type Props = {
  event: EventWithVenue;
  accentColor: string;
  levelBadges: string[];
  distanceKm: string;
  isLive?: boolean;
};

export function CardHeader({ event, accentColor, levelBadges, distanceKm, isLive }: Props) {
  return (
    <>
      <View style={styles.titleRow}>
        <View style={styles.titleInfo}>
          <View style={styles.titleLine}>
            <Text style={styles.title}>{event.title}</Text>
            {isLive && <LiveBadge />}
          </View>
          <Text style={[styles.venue, { color: accentColor }]}>{event.venue_name}</Text>
        </View>
        <View style={styles.distanceBox}>
          <Text style={styles.distanceNum}>{distanceKm}</Text>
          <Text style={styles.distanceUnit}>ק״מ</Text>
        </View>
      </View>

      <QuickInfo event={event} />

      <BadgeRow
        danceStyles={event.dance_styles}
        levelBadges={levelBadges}
        accentColor={accentColor}
        hasShelter={event.has_shelter}
      />
    </>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  titleInfo: {
    flex: 1,
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  titleLine: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'right',
  },
  venue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  distanceBox: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'center',
    minWidth: 52,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  distanceNum: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  distanceUnit: {
    color: Colors.textMuted,
    fontSize: 10,
  },
});
