import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Colors } from "@/constants/colors";

type Props = {
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function LiveToggle({ active, disabled, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[
        styles.toggle,
        active && !disabled && styles.toggleActive,
        disabled && styles.toggleDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={[styles.dot, (!active || disabled) && styles.dotMuted]} />
      <Text style={[styles.text, (!active || disabled) && styles.textMuted]}>LIVE</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
  },
  toggleActive: {
    backgroundColor: "rgba(239,68,68,0.2)",
    borderColor: "rgba(239,68,68,0.5)",
  },
  toggleDisabled: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    opacity: 0.4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ef4444",
  },
  dotMuted: {
    backgroundColor: Colors.textMuted,
  },
  text: {
    color: "#ef4444",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  textMuted: {
    color: Colors.textMuted,
  },
});
