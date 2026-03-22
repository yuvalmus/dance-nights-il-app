import { useState, useMemo, useCallback } from 'react';
import { TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { EventWithVenue } from '@/types/database';
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

export function EventCard({ event, isExpanded, onPress }: Props) {
  const [posterFullscreen, setPosterFullscreen] = useState(false);
  const accentColor = event.theme_color || Colors.primary;
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

  const handleNavigate = useCallback(() => {
    openNavigation(event.venue_lat, event.venue_lng, event.venue_name);
  }, [event.venue_lat, event.venue_lng, event.venue_name]);

  const handleRegister = useCallback(() => {
    if (event.registration_link) Linking.openURL(event.registration_link);
  }, [event.registration_link]);

  return (
    <>
      <TouchableOpacity
        style={[
          styles.card,
          { borderLeftColor: accentColor, borderLeftWidth: 3 },
          isExpanded && { borderColor: accentColor, borderWidth: 1, borderLeftWidth: 3 },
        ]}
        onPress={onPress}
        activeOpacity={0.85}
      >
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

        {event.pre_register && event.spots_total != null && event.spots_total > 0 && (
          <SpotsBar total={event.spots_total} taken={event.spots_taken} />
        )}

        {isExpanded && (
          <CardDetails
            event={event}
            accentColor={accentColor}
            hasCoordinates={hasCoordinates}
            onNavigate={handleNavigate}
            onRegister={handleRegister}
          />
        )}
      </TouchableOpacity>

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
});
