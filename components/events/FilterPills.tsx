import { View, ScrollView, StyleSheet } from "react-native";
import { Colors } from "@/constants/colors";
import { DANCE_STYLES, DANCE_STYLE_LABELS } from "@/constants/config";
import { DanceStylePill } from "./DanceStylePill";
import { LiveToggle } from "./LiveToggle";

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
  return (
    <View style={styles.row}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsContent}
        style={styles.pillsScroll}
      >
        <DanceStylePill
          label="הכל"
          active={!selectedDanceStyle}
          onPress={() => onDanceStyleSelect(null)}
        />

        {DANCE_STYLES.map((danceStyle) => (
          <DanceStylePill
            key={danceStyle}
            label={DANCE_STYLE_LABELS[danceStyle]}
            active={selectedDanceStyle === danceStyle}
            onPress={() => onDanceStyleSelect(selectedDanceStyle === danceStyle ? null : danceStyle)}
          />
        ))}
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
