import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { EventWithVenue } from '@/types/database';
import { formatTime } from '@/lib/date';

type Props = {
  event: EventWithVenue;
};

const iconSize = 13;

export function QuickInfo({ event }: Props) {
  return (
    <View style={styles.row}>
      {event.schedules?.[0] && (
        <View style={styles.item}>
          <Ionicons name="time-outline" size={iconSize} color={Colors.textSecondary} />
          <Text style={styles.text}>{formatTime(event.schedules[0].time)}</Text>
        </View>
      )}
      {event.price && !(event.pre_register && (event.registration_links?.length ?? 0) > 1) && (
        <View style={styles.item}>
          <Ionicons name="ticket-outline" size={iconSize} color={Colors.textSecondary} />
          <Text style={styles.text}>₪{event.price}</Text>
        </View>
      )}
      {event.dj && (
        <View style={styles.item}>
          <Ionicons name="headset-outline" size={iconSize} color={Colors.textSecondary} />
          <Text style={styles.text} numberOfLines={1}>{event.dj}</Text>
        </View>
      )}
      <View style={styles.item}>
        <Ionicons name="location-outline" size={iconSize} color={Colors.textSecondary} />
        <Text style={styles.text}>{event.city}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 14,
    marginTop: 10,
  },
  item: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  text: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
});
