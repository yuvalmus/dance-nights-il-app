import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';

type Props = {
  address: string;
  city: string;
  parkingInfo?: string | null;
  onNavigate: () => void;
};

export function AddressBox({ address, city, parkingInfo, onNavigate }: Props) {
  return (
    <View style={styles.box}>
      <View style={styles.row}>
        <View style={styles.info}>
          <View style={styles.labelRow}>
            <Ionicons name="location" size={12} color={Colors.textSecondary} />
            <Text style={styles.label}> כתובת</Text>
          </View>
          <Text style={styles.address}>{address}, {city}</Text>
          {parkingInfo && (
            <View style={styles.parkingRow}>
              <Ionicons name="car-outline" size={11} color={Colors.success} />
              <Text style={styles.parkingText}> {parkingInfo}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.navBtn} onPress={onNavigate}>
          <Ionicons name="navigate" size={18} color={Colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    gap: 5,
  },
  labelRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  address: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    marginTop: 2,
  },
  parkingRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 3,
  },
  parkingText: {
    color: Colors.success,
    fontSize: 11,
    textAlign: 'right',
  },
  navBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
});
