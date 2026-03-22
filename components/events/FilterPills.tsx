import { View, StyleSheet } from "react-native";
import { Colors } from "@/constants/colors";
import { DANCE_STYLES, DANCE_STYLE_LABELS } from "@/constants/config";
import { DanceStylePill } from "./DanceStylePill";
import { LiveToggle } from "./LiveToggle";

type Props = {
  selectedDanceStyle: string | null;
  onDanceStyleSelect: (danceStyle: string | null) => void;
  liveFilter: boolean;
  onLiveToggle: () => void;
};

export function FilterPills({
  selectedDanceStyle,
  onDanceStyleSelect,
  liveFilter,
  onLiveToggle,
}: Props) {
  return (
    <View style={styles.row}>
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

      <View style={styles.divider} />
      <LiveToggle active={liveFilter} onPress={onLiveToggle} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    paddingBottom: 8,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border,
  },
});
