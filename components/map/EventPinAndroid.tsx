import { View, Text, Image, StyleSheet, ImageSourcePropType } from 'react-native';
import { Colors } from '@/constants/colors';

const PIN_SIZE = 56;
const BORDER_WIDTH = 3;
const IMAGE_SIZE = PIN_SIZE - BORDER_WIDTH * 2;
const SELECTED_SCALE = 1.2;

type Props = {
  name: string;
  logo: ImageSourcePropType | null;
  themeColor: string;
  isSelected: boolean;
  onImageLoad?: () => void;
};

export function EventPinAndroid({ name, logo, themeColor, isSelected, onImageLoad }: Props) {
  const borderColor = isSelected ? Colors.primary : themeColor;

  if (!logo) {
    return (
      <View style={[styles.container, isSelected && styles.selected]} collapsable={false}>
        <View
          style={[
            styles.circle,
            { borderColor, backgroundColor: Colors.surface },
          ]}
          collapsable={false}
        >
          <Text style={styles.initial}>{name.charAt(0)}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isSelected && styles.selected]} collapsable={false}>
      <View
        style={[
          styles.circle,
          { borderColor, backgroundColor: Colors.surface },
        ]}
        collapsable={false}
      >
        <Image
          source={logo}
          style={styles.logoImage}
          resizeMode="cover"
          onLoad={onImageLoad}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: PIN_SIZE + 8,
    height: PIN_SIZE + 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    transform: [{ scale: SELECTED_SCALE }],
  },
  circle: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    borderRadius: PIN_SIZE / 2,
    borderWidth: BORDER_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: IMAGE_SIZE / 2,
  },
  initial: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
});
