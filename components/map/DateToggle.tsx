import { useCallback, useMemo, useState } from "react";
import {
  TouchableOpacity,
  TouchableWithoutFeedback,
  Text,
  StyleSheet,
  View,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@/components/ui/Icon";
import { Colors } from "@/constants/colors";
import { DATE_RIBBON_DAYS } from "@/constants/config";
import { formatDateKey } from "@/lib/date";
import { DateChip } from "./DateChip";

const DAY_NAMES_HE = [
  "יום א׳",
  "יום ב׳",
  "יום ג׳",
  "יום ד׳",
  "יום ה׳",
  "יום ו׳",
  "שבת",
];

function buildDates(count: number) {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      date: formatDateKey(d),
      label: i === 0 ? "היום" : DAY_NAMES_HE[d.getDay()],
      num: d.getDate(),
    };
  });
}

type Props = {
  selectedDate: string;
  todayString: string;
  onDateSelect: (date: string) => void;
};

const ANIM_MS = 250;
const BTN_SIZE = 44;
const CARD_WIDTH = 210;

export function DateToggle({ selectedDate, todayString, onDateSelect }: Props) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const dates = useMemo(() => buildDates(DATE_RIBBON_DAYS), []);

  const isToday = selectedDate === todayString;
  const progress = useSharedValue(0);

  const animateTo = useCallback((target: number) => {
    progress.value = withTiming(target, {
      duration: ANIM_MS,
      easing: target === 1 ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
    });
  }, []);

  const toggle = useCallback(() => {
    const willOpen = !open;
    setOpen(willOpen);
    animateTo(willOpen ? 1 : 0);
  }, [open, animateTo]);

  const close = useCallback(() => {
    setOpen(false);
    animateTo(0);
  }, [animateTo]);

  const handleDateSelect = useCallback(
    (date: string) => {
      onDateSelect(date);
      setOpen(false);
      animateTo(0);
    },
    [onDateSelect, animateTo],
  );

  const cardStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { scale: interpolate(progress.value, [0, 1], [0.85, 1]) },
      { translateY: interpolate(progress.value, [0, 1], [-8, 0]) },
    ],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
  }));

  return (
    <>
      {open && (
        <TouchableWithoutFeedback onPress={close}>
          <Animated.View style={[styles.backdrop, backdropStyle]} />
        </TouchableWithoutFeedback>
      )}

      <View style={[styles.anchor, { top: insets.top + 8 }]} pointerEvents="box-none">
        <TouchableOpacity
          style={[styles.toggleBtn, open && styles.toggleBtnOpen]}
          onPress={toggle}
          activeOpacity={0.8}
        >
          <Ionicons
            name="calendar-outline"
            size={20}
            color={open ? Colors.background : Colors.text}
          />
          {!isToday && !open && <View style={styles.dot} />}
        </TouchableOpacity>

        <Animated.View
          style={[styles.card, cardStyle]}
          pointerEvents={open ? "auto" : "none"}
        >
          <View style={styles.grid}>
            {dates.map((item) => (
              <DateChip
                key={item.date}
                label={item.label}
                num={item.num}
                active={selectedDate === item.date}
                onPress={() => handleDateSelect(item.date)}
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 19,
  },
  anchor: {
    position: "absolute",
    right: 14,
    zIndex: 20,
    alignItems: "flex-end",
  },
  toggleBtn: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_SIZE / 2,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: { elevation: 6 },
    }),
  },
  toggleBtnOpen: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
  card: {
    marginTop: 8,
    width: CARD_WIDTH,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: { elevation: 12 },
    }),
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
  },
});
