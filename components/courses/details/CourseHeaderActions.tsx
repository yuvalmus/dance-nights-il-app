import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';

type Props = {
  onShare: () => void;
  onAddToCalendar: () => void;
  calendarLoading: boolean;
  calendarDisabled: boolean;
};

export default function CourseHeaderActions({
  onShare,
  onAddToCalendar,
  calendarLoading,
  calendarDisabled,
}: Props) {
  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={onShare} style={styles.button} hitSlop={8}>
        <Ionicons name="share-outline" size={22} color={Colors.text} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onAddToCalendar}
        style={styles.button}
        hitSlop={8}
        disabled={calendarLoading || calendarDisabled}
      >
        {calendarLoading ? (
          <ActivityIndicator size="small" color={Colors.text} />
        ) : (
          <Ionicons
            name="calendar-outline"
            size={22}
            color={calendarDisabled ? Colors.textMuted : Colors.text}
          />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
  },
  button: {
    padding: 4,
  },
});
