import { View, Text, Image, ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';

const PIN_SIZE = 56;
const SELECTED_PIN_SIZE = 67;
const BORDER_WIDTH = 3;
const ARROW_WIDTH = 7;
const ARROW_HEIGHT = 8;

type Props = {
  name: string;
  logo: ImageSourcePropType | null;
  themeColors: string[];
  isSelected: boolean;
};

export function EventPinAndroid({ name, logo, themeColors, isSelected }: Props) {
  const colors = isSelected ? [Colors.primary, Colors.primary] : themeColors;
  const arrowColor = isSelected ? Colors.primary : themeColors[themeColors.length - 1];
  const size = isSelected ? SELECTED_PIN_SIZE : PIN_SIZE;
  const innerSize = size - BORDER_WIDTH * 2;
  const containerWidth = size + 8;
  const containerHeight = size + 8 + ARROW_HEIGHT;

  return (
    <View style={{
      width: containerWidth,
      height: containerHeight,
      alignItems: 'center',
    }}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {logo ? (
          <Image
            source={logo}
            style={{
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
              backgroundColor: Colors.surface,
            }}
            resizeMode="cover"
          />
        ) : (
          <View style={{
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            backgroundColor: Colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{
              color: Colors.text,
              fontSize: isSelected ? 26 : 22,
              fontWeight: '800',
            }}>{name.charAt(0)}</Text>
          </View>
        )}
      </LinearGradient>
      <View style={{
        width: 0,
        height: 0,
        borderLeftWidth: ARROW_WIDTH,
        borderRightWidth: ARROW_WIDTH,
        borderTopWidth: ARROW_HEIGHT,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: arrowColor,
        marginTop: -1,
      }} />
    </View>
  );
}
