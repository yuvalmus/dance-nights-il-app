import { useState, useMemo, useCallback } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { EventWithVenue, RegistrationLink } from '@/types/database';
import { DANCE_LEVEL_LABELS } from '@/constants/config';
import { isEventLive } from '@/lib/date';
import { openNavigation } from '@/lib/navigation';
import { SpotsBar } from '@/components/ui/SpotsBar';
import { HeroPoster } from './card/HeroPoster';
import { CardHeader } from './card/CardHeader';
import { CardDetails } from './card/CardDetails';
import { PosterModal } from './card/PosterModal';

type Props = {
  event: EventWithVenue;
  isExpanded: boolean;
  onPress: () => void;
};

function getAccumulatedSpots(links: RegistrationLink[]) {
  const withSpots = links.filter((l) => l.spots_total != null && l.spots_total > 0);
  if (withSpots.length === 0) return null;
  const total = withSpots.reduce((sum, l) => sum + l.spots_total!, 0);
  const taken = withSpots.reduce((sum, l) => sum + l.spots_taken, 0);
  return { total, taken };
}

export function EventCard({ event, isExpanded, onPress }: Props) {
  const [posterFullscreen, setPosterFullscreen] = useState(false);
  const themeColors = event.theme_colors?.length ? event.theme_colors : [Colors.primary];
  const accentColor = themeColors[0];
  const distanceKm = (event.distance_meters / 1000).toFixed(1);
  const hasPoster = !!event.poster_url;
  const hasCoordinates = !!(event.venue_lat && event.venue_lng);
  const live = isEventLive(event.date, event.schedules?.[0]?.time);

  const levelBadges = useMemo(() => {
    if (!event.schedules || event.schedules.length === 0) return ['כל הרמות'];
    const levels = event.schedules
      .map((s) => s.level)
      .filter((l): l is string => l != null);
    if (levels.length === 0) return ['כל הרמות'];
    const unique = [...new Set(levels)];
    return unique.map(
      (l) => DANCE_LEVEL_LABELS[l as keyof typeof DANCE_LEVEL_LABELS] ?? l,
    );
  }, [event.schedules]);

  const accumulated = useMemo(
    () => getAccumulatedSpots(event.registration_links || []),
    [event.registration_links],
  );

  const handleNavigate = useCallback(() => {
    openNavigation(event.venue_lat, event.venue_lng, event.venue_name);
  }, [event.venue_lat, event.venue_lng, event.venue_name]);

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.card,
          isExpanded && { borderColor: accentColor, borderWidth: 1 },
          pressed && { opacity: 0.85 },
        ]}
        onPress={onPress}
      >
        {/* Gradient left accent strip */}
        <LinearGradient
          colors={themeColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.leftStrip}
        />

        {isExpanded && hasPoster && (
          <HeroPoster
            posterUrl={event.poster_url!}
            onFullscreen={() => setPosterFullscreen(true)}
          />
        )}

        <CardHeader
          event={event}
          accentColor={accentColor}
          levelBadges={levelBadges}
          distanceKm={distanceKm}
          isLive={live}
        />

        {!isExpanded && event.pre_register && accumulated && (
          <SpotsBar total={accumulated.total} taken={accumulated.taken} />
        )}

        {isExpanded && (
          <CardDetails
            event={event}
            accentColor={accentColor}
            hasCoordinates={hasCoordinates}
            onNavigate={handleNavigate}
          />
        )}
      </Pressable>

      {hasPoster && (
        <PosterModal
          posterUrl={event.poster_url!}
          visible={posterFullscreen}
          onClose={() => setPosterFullscreen(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  leftStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
});
