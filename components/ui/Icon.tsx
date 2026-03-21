import React from "react";
import { Text } from "react-native";

// Glyph maps: icon-name → unicode code point
// These are the same maps @expo/vector-icons uses internally.
import ioniconsMap from "@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json";
import materialCommunityMap from "@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json";

interface IconProps {
  name: string;
  size: number;
  color: string;
}

// Renders icons by directly using the natively-embedded font family name
// (the TTF filename without extension), bypassing @expo/vector-icons'
// font loading system which uses different internal names and breaks.

export function Ionicons({ name, size, color }: IconProps) {
  const glyph = (ioniconsMap as Record<string, number>)[name];
  if (glyph === undefined) return null;
  return (
    <Text
      style={{
        fontFamily: "Ionicons",
        fontSize: size,
        color,
        fontWeight: "normal",
        fontStyle: "normal",
      }}
    >
      {String.fromCodePoint(glyph)}
    </Text>
  );
}

export function MaterialCommunityIcons({ name, size, color }: IconProps) {
  const glyph = (materialCommunityMap as Record<string, number>)[name];
  if (glyph === undefined) return null;
  return (
    <Text
      style={{
        fontFamily: "MaterialCommunityIcons",
        fontSize: size,
        color,
        fontWeight: "normal",
        fontStyle: "normal",
      }}
    >
      {String.fromCodePoint(glyph)}
    </Text>
  );
}
