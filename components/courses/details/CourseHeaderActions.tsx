import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';

type Props = {
  /** Public-facing actions — only meaningful for live, published courses. */
  onShare?: () => void;
  onAddToCalendar?: () => void;
  calendarLoading?: boolean;
  calendarDisabled?: boolean;
  /** Creator-only mutations. Passing any callback adds its icon. */
  onEdit?: () => void;
  onTogglePublish?: () => void;
  isPublished?: boolean;
  onDelete?: () => void;
};

export default function CourseHeaderActions({
  onShare,
  onAddToCalendar,
  calendarLoading,
  calendarDisabled,
  onEdit,
  onTogglePublish,
  isPublished,
  onDelete,
}: Props) {
  return (
    <View style={styles.row}>
      {onEdit && (
        <TouchableOpacity onPress={onEdit} style={styles.button} hitSlop={8}>
          <Ionicons name="pencil" size={20} color={Colors.text} />
        </TouchableOpacity>
      )}
      {onTogglePublish && (
        <TouchableOpacity onPress={onTogglePublish} style={styles.button} hitSlop={8}>
          <Ionicons
            name={isPublished ? 'eye' : 'eye-off'}
            size={20}
            color={isPublished ? Colors.success : Colors.textMuted}
          />
        </TouchableOpacity>
      )}
      {onDelete && (
        <TouchableOpacity onPress={onDelete} style={styles.button} hitSlop={8}>
          <Ionicons name="trash-outline" size={20} color={Colors.error} />
        </TouchableOpacity>
      )}
      {onShare && (
        <TouchableOpacity onPress={onShare} style={styles.button} hitSlop={8}>
          <Ionicons name="share-outline" size={22} color={Colors.text} />
        </TouchableOpacity>
      )}
      {onAddToCalendar && (
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
      )}
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
