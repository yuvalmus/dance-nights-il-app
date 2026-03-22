import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Colors } from "@/constants/colors";

type Props = {
  label: string;
  active: boolean;
  onPress: () => void;
};

export function DanceStylePill({ label, active, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.pill, active && styles.pillActive]}
      onPress={onPress}
    >
      <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
  text: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: "500",
  },
  textActive: {
    color: "#fff",
    fontWeight: "700",
  },
});
