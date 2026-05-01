import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

export type SegmentedTab<T extends string> = {
  key: T;
  label: string;
};

type Props<T extends string> = {
  tabs: SegmentedTab<T>[];
  active: T;
  onChange: (key: T) => void;
};

/**
 * Lightweight pill-style segmented control. Designed for in-page tabs
 * where pulling in a router-driven tab navigator would be overkill.
 */
export default function SegmentedTabs<T extends string>({
  tabs,
  active,
  onChange,
}: Props<T>) {
  return (
    <View style={styles.row}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
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
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  labelActive: {
    color: Colors.background,
    fontWeight: '700',
  },
});
