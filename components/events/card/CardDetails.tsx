import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { EventWithVenue } from '@/types/database';
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
});
