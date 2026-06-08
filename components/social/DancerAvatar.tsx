import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';

type Props = {
  size?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Circular friend avatar — a gold dancer on the deep-blue card colour,
 * echoing the profile screen's identity treatment. Friend payloads carry no
 * photo URLs, so this stands in wherever a friend is shown.
 */
export default function DancerAvatar({ size = 38, style }: Props) {
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      <MaterialCommunityIcons
        name="human-female-dance"
        size={Math.round(size * 0.58)}
        color={Colors.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
