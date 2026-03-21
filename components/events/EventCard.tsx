import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@/components/ui/Icon';
import { Colors, DanceStyleColors } from '@/constants/colors';
import { EventWithVenue } from '@/types/database';
import { formatDistance } from '@/lib/location';
import { DANCE_STYLE_LABELS } from '@/constants/config';
import { ShelterBadge } from '@/components/ui/ShelterBadge';
import { SpotsBar } from '@/components/ui/SpotsBar';

type Props = {
  event: EventWithVenue;
  isExpanded: boolean;
  onPress: () => void;
};

export function EventCard({ event, isExpanded, onPress }: Props) {
  const openNavigation = () => {
    const url = `https://waze.com/ul?ll=${event.venue_lat},${event.venue_lng}&navigate=yes`;
    Linking.openURL(url);
  };

  const openArbox = () => {
    if (event.arbox_link) Linking.openURL(event.arbox_link);
  };

  return (
    <TouchableOpacity
      style={[styles.card, isExpanded && styles.cardExpanded]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Collapsed state — always visible */}
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.venue}>{event.venue_name}</Text>

          <View style={styles.meta}>
            {event.schedules?.[0] && (
              <Text style={styles.time}>{event.schedules[0].time}</Text>
            )}
            {event.price && <Text style={styles.price}>{event.price}</Text>}
            <Text style={styles.distance}>{formatDistance(event.distance_meters)}</Text>
          </View>

          {/* Style tags */}
          <View style={styles.tags}>
            {event.dance_styles.map((s) => (
              <View
                key={s}
                style={[styles.tag, { backgroundColor: DanceStyleColors[s] ?? Colors.primary }]}
              >
                <Text style={styles.tagText}>
                  {DANCE_STYLE_LABELS[s as keyof typeof DANCE_STYLE_LABELS] ?? s}
                </Text>
              </View>
            ))}
            {event.has_shelter && <ShelterBadge />}
          </View>
        </View>

        {/* Poster thumbnail */}
        {event.poster_url && (
          <Image
            source={{ uri: event.poster_url }}
            style={styles.thumbnail}
            contentFit="cover"
            transition={200}
          />
        )}
      </View>

      {/* Spots bar */}
      {event.spots_total && (
        <SpotsBar total={event.spots_total} taken={event.spots_taken} />
      )}

      {/* Expanded state */}
      {isExpanded && (
        <View style={styles.expanded}>
          {/* Hero poster */}
          {event.poster_url && (
            <Image
              source={{ uri: event.poster_url }}
              style={styles.heroPoster}
              contentFit="cover"
              transition={300}
            />
          )}

          {/* Description */}
          {event.description && (
            <Text style={styles.description}>{event.description}</Text>
          )}

          {/* Full schedule */}
          {event.schedules && event.schedules.length > 0 && (
            <View style={styles.scheduleSection}>
              <Text style={styles.sectionLabel}>לוח זמנים</Text>
              {event.schedules.map((s, i) => (
                <View key={i} style={styles.scheduleRow}>
                  <Text style={styles.scheduleTime}>{s.time}</Text>
                  <Text style={styles.scheduleDesc}>{s.description}</Text>
                  {s.level && <Text style={styles.scheduleLevel}>{s.level}</Text>}
                </View>
              ))}
            </View>
          )}

          {/* DJ */}
          {event.dj && (
            <Text style={styles.dj}>DJ: {event.dj}</Text>
          )}

          {/* Parking */}
          {event.parking_info && (
            <Text style={styles.parking}>
              <Ionicons name="car" size={14} color={Colors.textSecondary} /> {event.parking_info}
            </Text>
          )}

          {/* Action buttons */}
          <View style={styles.actions}>
            {event.arbox_link && (
              <TouchableOpacity style={styles.ctaButton} onPress={openArbox}>
                <Text style={styles.ctaText}>הרשמה ב-Arbox</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.navButton} onPress={openNavigation}>
              <Ionicons name="navigate" size={18} color={Colors.text} />
              <Text style={styles.navText}>נווט</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardExpanded: {
    borderColor: Colors.primary,
  },
  row: {
    flexDirection: 'row-reverse',
    gap: 12,
  },
  info: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'right',
  },
  venue: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  meta: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginTop: 6,
  },
  time: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  price: {
    color: Colors.text,
    fontSize: 13,
  },
  distance: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  tags: {
    flexDirection: 'row-reverse',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },
  // Expanded
  expanded: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  heroPoster: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'right',
    lineHeight: 20,
    marginBottom: 12,
  },
  scheduleSection: {
    marginBottom: 12,
  },
  sectionLabel: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 6,
  },
  scheduleRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginBottom: 4,
  },
  scheduleTime: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
    width: 48,
    textAlign: 'right',
  },
  scheduleDesc: {
    color: Colors.text,
    fontSize: 13,
    flex: 1,
    textAlign: 'right',
  },
  scheduleLevel: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  dj: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'right',
    marginBottom: 6,
  },
  parking: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  ctaButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  ctaText: {
    color: Colors.background,
    fontWeight: '700',
    fontSize: 14,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navText: {
    color: Colors.text,
    fontSize: 14,
  },
});
