import { useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { DANCE_LEVEL_LABELS, DanceLevel } from '@/constants/config';

type Mode = 'icon' | 'text' | 'full';
type Size = 'sm' | 'md';

type Props = {
  /** null / undefined = open for all levels */
  level?: DanceLevel | null;
  mode?: Mode;
  size?: Size;
  /** When true and mode is 'icon', tapping shows a floating tooltip with the label */
  pressable?: boolean;
};

const LEVEL_CONFIG = {
  beginner: { color: Colors.levelBeginner, stars: 1, label: DANCE_LEVEL_LABELS.beginner },
  intermediate: { color: Colors.levelIntermediate, stars: 2, label: DANCE_LEVEL_LABELS.intermediate },
  master: { color: Colors.levelMaster, stars: 3, label: DANCE_LEVEL_LABELS.master },
} as const;

const OPEN_COLOR = Colors.levelOpen;
const OPEN_LABEL = 'כל הרמות';

const SIZES = {
  sm: { icon: 12, text: 11, gap: 2 },
  md: { icon: 15, text: 13, gap: 4 },
} as const;

export default function DanceLevelBadge({ level, mode = 'full', size = 'md', pressable = false }: Props) {
  const s = SIZES[size];
  const isOpen = !level;
  const color = isOpen ? OPEN_COLOR : LEVEL_CONFIG[level].color;
  const label = isOpen ? OPEN_LABEL : LEVEL_CONFIG[level].label;

  const canPress = pressable && mode === 'icon';
  const anchorRef = useRef<View>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number } | null>(null);

  const handlePress = useCallback(() => {
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      setTooltip({ x: x + width / 2, y: y + height + 6 });
    });
  }, []);

  const dismiss = useCallback(() => setTooltip(null), []);

  const iconContent = isOpen ? (
    <Ionicons name="infinite-outline" size={s.icon + 2} color={color} />
  ) : (
    <View style={styles.stars}>
      {Array.from({ length: LEVEL_CONFIG[level].stars }).map((_, i) => (
        <Ionicons key={i} name="star" size={s.icon} color={color} />
      ))}
    </View>
  );

  const textContent = (
    <Text style={[styles.label, { fontSize: s.text, color }]}>
      {label}
    </Text>
  );

  const body = (
    <View style={[styles.row, { gap: s.gap }]}>
      {mode !== 'text' && iconContent}
      {mode !== 'icon' && textContent}
    </View>
  );

  if (!canPress) return body;

  return (
    <>
      <TouchableOpacity ref={anchorRef} onPress={handlePress} hitSlop={8}>
        {body}
      </TouchableOpacity>

      {tooltip && (
        <Modal transparent visible animationType="fade" onRequestClose={dismiss}>
          <Pressable style={styles.overlay} onPress={dismiss}>
            <View
              style={[
                styles.tooltip,
                { top: tooltip.y, left: tooltip.x },
              ]}
            >
              <Text style={[styles.tooltipText, { color }]}>{label}</Text>
              <View style={[styles.tooltipArrow, { borderBottomColor: 'rgba(22, 33, 62, 0.95)' }]} />
            </View>
          </Pressable>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    gap: 1,
  },
  label: {
    fontWeight: '700',
  },
  overlay: {
    flex: 1,
  },
  tooltip: {
    position: 'absolute',
    transform: [{ translateX: '-50%' }],
    backgroundColor: 'rgba(22, 33, 62, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tooltipArrow: {
    position: 'absolute',
    top: -6,
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  tooltipText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});
