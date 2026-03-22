import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { EventWithVenue } from '@/types/database';
import { ScheduleSection } from './ScheduleSection';
import { InstructorPills } from './InstructorPills';
import { AddressBox } from './AddressBox';

type Props = {
  event: EventWithVenue;
  accentColor: string;
  hasCoordinates: boolean;
  onNavigate: () => void;
  onRegister: () => void;
};

export function CardDetails({ event, accentColor, hasCoordinates, onNavigate, onRegister }: Props) {
  return (
    <View style={styles.container}>
      {event.description && (
        <Text style={styles.description}>{event.description}</Text>
      )}

      {event.schedules && event.schedules.length > 0 && (
        <ScheduleSection schedules={event.schedules} accentColor={accentColor} />
      )}

      {event.instructors && event.instructors.length > 0 && (
        <InstructorPills instructors={event.instructors} accentColor={accentColor} />
      )}

      {event.price_note && <Text style={styles.priceNote}>{event.price_note}</Text>}

      {(event.address || event.city || hasCoordinates) && (
        <AddressBox
          address={event.address}
          city={event.city}
          parkingInfo={event.parking_info}
          hasCoordinates={hasCoordinates}
          onNavigate={onNavigate}
        />
      )}

      {event.pre_register ? (
        <TouchableOpacity
          style={[styles.cta, { backgroundColor: accentColor }]}
          onPress={onRegister}
        >
          <Text style={styles.ctaText}>הרשמה ←</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.cta}>
          <Text style={styles.ctaFreeText}>כניסה חופשית ✓</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'right',
    lineHeight: 21,
    marginBottom: 12,
  },
  priceNote: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 10,
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
  ctaFreeText: {
    color: Colors.success,
    fontWeight: '700',
    fontSize: 14,
  },
});
