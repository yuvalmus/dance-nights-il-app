import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

type PillItem = {
  value: string;
  label: string;
  activeColor?: string;
};

type PillSelectProps = {
  items: PillItem[];
  selected: string[];
  onToggle: (value: string) => void;
};

export default function PillSelect({ items, selected, onToggle }: PillSelectProps) {
  return (
    <View style={styles.row}>
      {items.map((item) => {
        const isActive = selected.includes(item.value);
        const activeBg = item.activeColor || Colors.primary;

        return (
          <TouchableOpacity
            key={item.value}
            style={[
              styles.pill,
              isActive && { backgroundColor: activeBg, borderColor: activeBg },
            ]}
            onPress={() => onToggle(item.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  pillTextActive: {
    color: Colors.background,
    fontWeight: '700',
  },
});
