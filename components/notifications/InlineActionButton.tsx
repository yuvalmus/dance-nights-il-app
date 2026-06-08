import { Text, TouchableOpacity, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Colors } from '@/constants/colors';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
};

/**
 * Compact inline-action button for notification rows. Sized so two fit
 * comfortably on the same row — taller than a pill, shorter than a CTA.
 */
export default function InlineActionButton({
  label,
  onPress,
  variant = 'primary',
  loading = false,
}: Props) {
  return (
    <TouchableOpacity
      style={[styles.btn, variant === 'secondary' ? styles.secondary : styles.primary]}
      onPress={onPress}
      activeOpacity={0.75}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'secondary' ? Colors.primary : Colors.background}
        />
      ) : (
        <View>
          <Text
            style={[
              styles.label,
              variant === 'secondary' ? styles.labelSecondary : styles.labelPrimary,
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  labelPrimary: {
    color: Colors.background,
  },
  labelSecondary: {
    color: Colors.textSecondary,
  },
});
