import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { EventWithVenue } from '@/types/database';
import { useGoingToggle } from '@/hooks/useGoingToggle';
import { useFriendsAtActivity } from '@/hooks/useFriendsAtActivity';
import GoingToggle from '@/components/social/GoingToggle';
import FriendsGoingStrip from '@/components/social/FriendsGoingStrip';
import { ScheduleSection } from './ScheduleSection';
import { InstructorPills } from './InstructorPills';
import { AddressBox } from './AddressBox';
import RegistrationLinks from './RegistrationLinks';

type Props = {
  event: EventWithVenue;
  accentColor: string;
  hasCoordinates: boolean;
  onNavigate: () => void;
};

export function CardDetails({ event, accentColor, hasCoordinates, onNavigate }: Props) {
  const { isGoing, loading: goingLoading, toggling, toggle } = useGoingToggle({ eventId: event.event_id });
  const { friends } = useFriendsAtActivity({ eventId: event.event_id });

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

      {(event.address || event.city || hasCoordinates) && (
        <AddressBox
          address={event.address}
          city={event.city}
          parkingInfo={event.parking_info}
          hasCoordinates={hasCoordinates}
          onNavigate={onNavigate}
        />
      )}

      <RegistrationLinks
        links={event.pre_register ? (event.registration_links || []) : []}
        preRegister={event.pre_register}
        price={event.price}
        priceNote={event.price_note}
        accentColor={accentColor}
      />

      {/* Social: going toggle + friends strip */}
      <View style={styles.socialSection}>
        <GoingToggle
          isGoing={isGoing}
          onToggle={toggle}
          loading={goingLoading || toggling}
        />
        <FriendsGoingStrip friends={friends} />
      </View>
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
  socialSection: {
    marginTop: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 12,
  },
});
