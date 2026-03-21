import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';

export function ShelterBadge() {
  return (
    <View style={styles.badge}>
      <Ionicons name="shield-checkmark" size={12} color="#fff" />
      <Text style={styles.text}>מקלט</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.shelter,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  text: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});
