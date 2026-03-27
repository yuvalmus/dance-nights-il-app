import { View, Text, StyleSheet, ImageSourcePropType } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/colors";

const PIN_SIZE = 60;
const BORDER_WIDTH = 2.5;
const INNER_SIZE = PIN_SIZE - BORDER_WIDTH * 2;
const LOGO_SIZE = INNER_SIZE - 4;
const SELECTED_SCALE = 1.2;

type Props = {
  name: string;
  logo: ImageSourcePropType | null;
  themeColors: string[];
  isSelected: boolean;
};

export function EventPinIOS({ name, logo, themeColors, isSelected }: Props) {
  const colors = isSelected ? [Colors.primary, Colors.primary] : themeColors;
  const arrowColor = isSelected ? Colors.primary : themeColors[themeColors.length - 1];

  return (
    <View style={[styles.container, isSelected && styles.containerSelected]}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientRing, isSelected && styles.ringSelected]}
      >
        <View style={styles.innerCircle}>
          {logo ? (
            <Image source={logo} style={styles.logo} contentFit="contain" />
          ) : (
            <Text style={styles.initial} numberOfLines={1}>
              {name.charAt(0)}
            </Text>
          )}
        </View>
      </LinearGradient>
      <View style={[styles.arrow, { borderTopColor: arrowColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  containerSelected: {
    transform: [{ scale: SELECTED_SCALE }],
  },
  gradientRing: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    borderRadius: PIN_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  ringSelected: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 10,
  },
  innerCircle: {
    width: INNER_SIZE,
    height: INNER_SIZE,
    borderRadius: INNER_SIZE / 2,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
  },
  initial: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -1,
  },
});
