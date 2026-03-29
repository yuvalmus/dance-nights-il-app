import { View, ScrollView, StyleSheet } from "react-native";
import { Colors } from "@/constants/colors";
import { DANCE_STYLES, DANCE_STYLE_LABELS } from "@/constants/config";
import PillSelect from "@/components/ui/PillSelect";
import { LiveToggle } from "./LiveToggle";

const ALL_VALUE = 'all';

const PILL_ITEMS = [
  { value: ALL_VALUE, label: 'הכל' },
  ...DANCE_STYLES.map((s) => ({ value: s, label: DANCE_STYLE_LABELS[s] })),
];

type Props = {
  selectedDanceStyle: string | null;
  onDanceStyleSelect: (danceStyle: string | null) => void;
  liveFilter: boolean;
  onLiveToggle: () => void;
  liveDisabled?: boolean;
};

export function FilterPills({
  selectedDanceStyle,
  onDanceStyleSelect,
  liveFilter,
  onLiveToggle,
  liveDisabled,
}: Props) {
  const handleToggle = (value: string) => {
    onDanceStyleSelect(value === ALL_VALUE || value === '' ? null : value);
  };

  const selected = selectedDanceStyle ?? ALL_VALUE;

  return (
    <View style={styles.row}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsContent}
        style={styles.pillsScroll}
      >
        <PillSelect
          items={PILL_ITEMS}
          selected={[selected]}
          onToggle={handleToggle}
          mode="single"
          size="small"
          allowEmpty={false}
        />
      </ScrollView>

      <View style={styles.divider} />
      <LiveToggle active={liveFilter} disabled={liveDisabled} onPress={onLiveToggle} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    paddingBottom: 8,
  },
  pillsScroll: {
    flex: 1,
  },
  pillsContent: {
    flexDirection: "row-reverse",
    gap: 8,
    flexGrow: 1,
    justifyContent: "flex-start",
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border,
  },
});
