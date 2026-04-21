import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { Venue } from '@/types/database';
import { EventWithSchedules } from '@/hooks/useVenue';
import ActionButton from '@/components/ui/ActionButton';
import VenueEventRow from './VenueEventRow';
import InstructorSection from './InstructorSection';
import ApprovalInboxSection from './ApprovalInboxSection';

type MyVenueSectionProps = {
  venue: Venue;
  events: EventWithSchedules[];
  onTogglePublish: (eventId: string, isPublished: boolean) => Promise<void>;
  onDelete: (eventId: string) => Promise<void>;
};

export default function MyVenueSection({
  venue,
  events,
  onTogglePublish,
  onDelete,
}: MyVenueSectionProps) {
  const router = useRouter();

  const today = new Date().toISOString().split('T')[0];
  const upcomingEvents = events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const pastEvents = events.filter((e) => e.date < today).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="business" size={22} color={Colors.primary} />
        <View style={styles.headerText}>
          <Text style={styles.sectionTitle}>המקום שלי</Text>
          <Text style={styles.venueName}>{venue.name}</Text>
        </View>
      </View>

      {/* Add event button */}
      <ActionButton
        label="+ הוסף אירוע חדש"
        onPress={() => router.push('/venue/add-event')}
      />

      {/* Upcoming events */}
      {upcomingEvents.length > 0 && (
        <View style={styles.eventGroup}>
          <Text style={styles.groupTitle}>אירועים קרובים</Text>
          {upcomingEvents.map((event) => (
            <VenueEventRow
              key={event.id}
              event={event}
              onTogglePublish={onTogglePublish}
              onDelete={onDelete}
            />
          ))}
        </View>
      )}

      {/* Past events */}
      {pastEvents.length > 0 && (
        <View style={styles.eventGroup}>
          <Text style={styles.groupTitle}>אירועים שעברו</Text>
          {pastEvents.slice(0, 5).map((event) => (
            <VenueEventRow
              key={event.id}
              event={event}
              onTogglePublish={onTogglePublish}
              onDelete={onDelete}
            />
          ))}
        </View>
      )}

      {events.length === 0 && (
        <Text style={styles.emptyText}>אין אירועים עדיין. הוסף את האירוע הראשון שלך!</Text>
      )}

      <ApprovalInboxSection venueId={venue.id} />
      <InstructorSection venueId={venue.id} />
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
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  venueName: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  eventGroup: {
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
