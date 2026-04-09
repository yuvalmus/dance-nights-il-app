import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { SpotsBar } from '@/components/ui/SpotsBar';

type Props = {
  price: number | null;
  registrationUrl: string | null;
  spotsTotal: number | null;
  spotsTaken: number;
};

export default function CourseBottomBar({ price, registrationUrl, spotsTotal, spotsTaken }: Props) {
  const insets = useSafeAreaInsets();

  const handleRegister = () => {
    if (registrationUrl) Linking.openURL(registrationUrl);
  };

  const hasSpots = spotsTotal !== null;
  const canRegister = !!registrationUrl;

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {hasSpots && (
        <SpotsBar total={spotsTotal!} taken={spotsTaken} />
      )}
      <View style={styles.row}>
        {/* Register button — right side (RTL) */}
        <TouchableOpacity
          style={[styles.registerButton, !canRegister && styles.registerDisabled]}
          onPress={handleRegister}
          activeOpacity={0.7}
          disabled={!canRegister}
        >
          <Text style={styles.registerText}>
            {canRegister ? 'הרשמה לקורס' : 'הרשמה בקרוב'}
          </Text>
        </TouchableOpacity>

        {/* Price — left side (RTL) */}
        {price && (
          <View style={styles.priceBlock}>
            <Text style={styles.priceLabel}>מחיר הקורס</Text>
            <Text style={styles.priceValue}>{price}₪</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  registerButton: {
    flex: 1,
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 8,
  },
  registerDisabled: {
    opacity: 0.5,
  },
  registerText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  priceBlock: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 2,
  },
  priceLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  priceValue: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
});
