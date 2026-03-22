import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Colors } from "@/constants/colors";

type Props = {
  label: string;
  num: number;
  active: boolean;
  onPress: () => void;
};

export function DateChip({ label, num, active, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.label, active && styles.labelActive]}>
        {label}
      </Text>
      <Text style={[styles.num, active && styles.numActive]}>
        {num}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: "center",
    justifyContent: "center",
    width: 58,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.surfaceLight,
  },
  chipActive: {
    backgroundColor: Colors.primary,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: "500",
  },
  labelActive: {
    color: Colors.background,
    fontWeight: "600",
  },
  num: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: "700",
    marginTop: 1,
  },
  numActive: {
    color: Colors.background,
  },
});
