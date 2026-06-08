import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';

type Props = {
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
};

/**
 * Heart pill that filters the event list to favourited venues. Mirrors the
 * shape of LiveToggle so the two read as a coherent pair in the filter row.
 */
export default function FavoritesToggle({ active, disabled, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[
        styles.toggle,
        active && !disabled && styles.toggleActive,
        disabled && styles.toggleDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityLabel="מקומות מועדפים"
    >
      <Ionicons
        name={active ? 'heart' : 'heart-outline'}
        size={16}
        color={active && !disabled ? Colors.primary : Colors.textSecondary}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(212, 160, 23, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.25)',
  },
  toggleActive: {
    backgroundColor: 'rgba(212, 160, 23, 0.22)',
    borderColor: Colors.primary,
  },
  toggleDisabled: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    opacity: 0.4,
  },
});
