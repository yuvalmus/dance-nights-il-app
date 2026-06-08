import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { EventWithVenue } from '@/types/database';
import { DanceLevel } from '@/constants/config';
import { LiveBadge } from './LiveBadge';
import { QuickInfo } from './QuickInfo';
import { BadgeRow } from './BadgeRow';
import VenueFavoriteButton from './VenueFavoriteButton';

type Props = {
  event: EventWithVenue;
  accentColor: string;
  levelBadges: (DanceLevel | null)[];
  distanceKm: string;
  isLive?: boolean;
};

export function CardHeader({ event, accentColor, levelBadges, distanceKm, isLive }: Props) {
  return (
    <>
      <View style={styles.titleRow}>
        <View style={styles.titleInfo}>
          <Text style={styles.title}>{event.title}</Text>
          <View style={styles.venueRow}>
            <Text style={[styles.venue, { color: accentColor }]}>{event.venue_name}</Text>
            <VenueFavoriteButton venueId={event.venue_id} />
          </View>
        </View>
        {isLive && <LiveBadge />}
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
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 12,
    gap: 10,
  },
  titleInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'right',
  },
  venueRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  venue: {
    fontSize: 14,
    fontWeight: '700',
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
