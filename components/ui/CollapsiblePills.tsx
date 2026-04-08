import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Colors } from '@/constants/colors';

type PillItem = {
  value: string;
  label: string;
};

type Props = {
  items: PillItem[];
  selected: string[];
  onToggle: (value: string) => void;
  collapsedHeight?: number;
};

const DEFAULT_COLLAPSED_HEIGHT = 82; // ~2 rows of small pills

export default function CollapsiblePills({
  items,
  selected,
  onToggle,
  collapsedHeight = DEFAULT_COLLAPSED_HEIGHT,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  const isOverflowing = contentHeight > collapsedHeight;

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const height = e.nativeEvent.layout.height;
    if (height > 0) setContentHeight(height);
  }, []);

  const hiddenCount = isOverflowing && !expanded
    ? items.length - estimateVisibleCount(items.length, collapsedHeight, contentHeight)
    : 0;

  return (
    <View>
      <View style={[
        !expanded && isOverflowing && { maxHeight: collapsedHeight, overflow: 'hidden' as const },
      ]}>
        <View style={styles.pillsWrap} onLayout={handleLayout}>
          {items.map((item) => {
            const isActive = selected.includes(item.value);
            return (
              <TouchableOpacity
                key={item.value}
                style={[styles.pill, isActive && styles.pillActive]}
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
      </View>

      {isOverflowing && (
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setExpanded((prev) => !prev)}
          activeOpacity={0.7}
        >
          <Text style={styles.toggleText}>
            {expanded ? 'הצג פחות' : `הצג עוד ${hiddenCount > 0 ? `(${hiddenCount})` : ''}`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function estimateVisibleCount(total: number, collapsedH: number, fullH: number): number {
  if (fullH <= 0) return total;
  const ratio = collapsedH / fullH;
  return Math.max(1, Math.floor(total * ratio));
}

const styles = StyleSheet.create({
  pillsWrap: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
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
    color: Colors.background,
    fontWeight: '700',
  },
  toggleButton: {
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  toggleText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
