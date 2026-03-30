import { ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
  mode?: 'multi' | 'single';
  size?: 'default' | 'small';
  allowEmpty?: boolean;
};

export default function PillSelect({
  items,
  selected,
  onToggle,
  mode = 'multi',
  size = 'default',
  allowEmpty = true,
}: PillSelectProps) {
  const isSmall = size === 'small';

  const handlePress = (value: string) => {
    const isSelected = selected.includes(value);

    if (isSelected && !allowEmpty) {
      if (mode === 'single') return;
      if (mode === 'multi' && selected.length <= 1) return;
    }

    if (mode === 'single') {
      onToggle(isSelected ? '' : value);
    } else {
      onToggle(value);
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {items.map((item) => {
        const isActive = selected.includes(item.value);
        const activeBg = item.activeColor || Colors.primary;

        return (
          <TouchableOpacity
            key={item.value}
            style={[
              styles.pill,
              isSmall && styles.pillSmall,
              isActive && { backgroundColor: activeBg, borderColor: activeBg },
            ]}
            onPress={() => handlePress(item.value)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.pillText,
              isSmall && styles.pillTextSmall,
              isActive && styles.pillTextActive,
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    flexGrow: 1,
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
  pillSmall: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pillText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  pillTextSmall: {
    fontSize: 13,
  },
  pillTextActive: {
    color: Colors.background,
    fontWeight: '700',
  },
});
