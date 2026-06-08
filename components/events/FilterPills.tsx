import { View, StyleSheet } from "react-native";
import { Colors } from "@/constants/colors";
import { DANCE_STYLES, DANCE_STYLE_LABELS } from "@/constants/config";
import PillSelect from "@/components/ui/PillSelect";
import { LiveToggle } from "./LiveToggle";
import FavoritesToggle from "./FavoritesToggle";

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
  favoritesFilter: boolean;
  onFavoritesToggle: () => void;
  favoritesDisabled?: boolean;
};

export function FilterPills({
  selectedDanceStyle,
  onDanceStyleSelect,
  liveFilter,
  onLiveToggle,
  liveDisabled,
  favoritesFilter,
  onFavoritesToggle,
  favoritesDisabled,
}: Props) {
  const handleToggle = (value: string) => {
    onDanceStyleSelect(value === ALL_VALUE || value === '' ? null : value);
  };

  const selected = selectedDanceStyle ?? ALL_VALUE;

  return (
    <View style={styles.row}>
      <View style={styles.pillsContainer}>
        <PillSelect
          items={PILL_ITEMS}
          selected={[selected]}
          onToggle={handleToggle}
          mode="single"
          size="small"
          allowEmpty={false}
        />
      </View>

      <View style={styles.divider} />
      <FavoritesToggle
        active={favoritesFilter}
        disabled={favoritesDisabled}
        onPress={onFavoritesToggle}
      />
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
  pillsContainer: {
    flex: 1,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border,
  },
});
