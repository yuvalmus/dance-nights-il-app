import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { EventWithSchedules } from '@/hooks/useVenue';
import ActionButton from '@/components/ui/ActionButton';
import VenueEventRow from './VenueEventRow';

type Props = {
  events: EventWithSchedules[];
  onTogglePublish: (eventId: string, isPublished: boolean) => Promise<void>;
  onDelete: (eventId: string) => Promise<void>;
};

const PAST_LIMIT = 5;

/**
 * Card-styled list of a venue's events with the "add event" CTA. Pulled
 * out of the old MyVenueSection so the management screen can mount just
 * the list without the venue-identity header (the manage screen already
 * shows venue name + logo in its own header card).
 */
export default function VenueEventsList({
  events,
  onTogglePublish,
  onDelete,
}: Props) {
  const router = useRouter();

  const today = new Date().toISOString().split('T')[0];
  const upcoming = events
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const past = events
    .filter((e) => e.date < today)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="calendar-outline" size={22} color={Colors.primary} />
        <Text style={styles.title}>האירועים שלי</Text>
      </View>

      <ActionButton
        label="+ הוסף אירוע חדש"
        onPress={() => router.push('/venue/add-event')}
      />

      {upcoming.length > 0 && (
        <View style={styles.group}>
          <Text style={styles.groupTitle}>אירועים קרובים</Text>
          {upcoming.map((event) => (
            <VenueEventRow
              key={event.id}
              event={event}
              onTogglePublish={onTogglePublish}
              onDelete={onDelete}
            />
          ))}
        </View>
      )}

      {past.length > 0 && (
        <View style={styles.group}>
          <Text style={styles.groupTitle}>אירועים שעברו</Text>
          {past.slice(0, PAST_LIMIT).map((event) => (
            <VenueEventRow key={event.id} event={event} />
          ))}
        </View>
      )}

      {events.length === 0 && (
        <Text style={styles.emptyText}>
          אין אירועים עדיין. הוסף את האירוע הראשון שלך!
        </Text>
      )}
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
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  title: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  group: {
    marginTop: 16,
  },
  groupTitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 8,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
});
