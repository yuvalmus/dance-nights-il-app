import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';

type Props = {
  onApprove: () => void;
  onReject: () => void;
  loading?: boolean;
};

/**
 * Header actions shown on the venue owner's approval view of a pending course.
 * Mirrors the layout of `CourseHeaderActions` (two icon buttons) but swaps the
 * share/calendar pair for approve (V, leftmost) and reject (X).
 */
export default function CourseApprovalHeaderActions({
  onApprove,
  onReject,
  loading,
}: Props) {
  return (
    <View style={styles.row}>
      <TouchableOpacity
        onPress={onApprove}
        style={[styles.button, styles.approve]}
        hitSlop={8}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={Colors.background} />
        ) : (
          <Ionicons name="checkmark" size={20} color={Colors.background} />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onReject}
        style={[styles.button, styles.reject]}
        hitSlop={8}
        disabled={loading}
      >
        <Ionicons name="close" size={20} color={Colors.error} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 7,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  approve: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  reject: {
    borderColor: Colors.error,
  },
});
