import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors, DanceStyleColors } from '@/constants/colors';
import { DANCE_STYLES, DANCE_STYLE_LABELS } from '@/constants/config';

type Props = {
  selectedStyle: string | null;
  onStyleSelect: (style: string | null) => void;
};

export function FilterPills({ selectedStyle, onStyleSelect }: Props) {
  return (
    <View style={styles.container}>
      {/* "All" pill */}
      <TouchableOpacity
        style={[styles.pill, !selectedStyle && styles.pillActive]}
        onPress={() => onStyleSelect(null)}
      >
        <Text style={[styles.pillText, !selectedStyle && styles.pillTextActive]}>
          הכל
        </Text>
      </TouchableOpacity>

      {DANCE_STYLES.map((style) => {
        const isActive = selectedStyle === style;
        return (
          <TouchableOpacity
            key={style}
            style={[
              styles.pill,
              isActive && { backgroundColor: DanceStyleColors[style], borderColor: DanceStyleColors[style] },
            ]}
            onPress={() => onStyleSelect(isActive ? null : style)}
          >
            <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
              {DANCE_STYLE_LABELS[style]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    gap: 8,
    paddingBottom: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  pillTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
});
