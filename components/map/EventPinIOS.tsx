import { View, Text, StyleSheet, ImageSourcePropType } from "react-native";
import { Image } from "expo-image";
import { Colors } from "@/constants/colors";

const PIN_SIZE = 60;
const BORDER_WIDTH = 2.5;
const LOGO_SIZE = PIN_SIZE - BORDER_WIDTH * 2 - 4;
const SELECTED_SCALE = 1.2;

type Props = {
  name: string;
  logo: ImageSourcePropType | null;
  themeColor: string;
  isSelected: boolean;
};

export function EventPinIOS({ name, logo, themeColor, isSelected }: Props) {
  const borderColor = isSelected ? Colors.primary : themeColor;

  return (
    <View style={[styles.container, isSelected && styles.containerSelected]}>
      <View
        style={[
          styles.circle,
          { borderColor },
          isSelected && styles.circleSelected,
        ]}
      >
        {logo ? (
          <Image source={logo} style={styles.logo} contentFit="contain" />
        ) : (
          <Text style={styles.initial} numberOfLines={1}>
            {name.charAt(0)}
          </Text>
        )}
      </View>
      <View style={[styles.arrow, { borderTopColor: borderColor }]} />
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
  circle: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    borderRadius: PIN_SIZE / 2,
    borderWidth: BORDER_WIDTH,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  circleSelected: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 10,
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
