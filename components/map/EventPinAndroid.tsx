import { View, Text, Image, ImageSourcePropType } from 'react-native';
import { Colors } from '@/constants/colors';

const PIN_SIZE = 56;
const SELECTED_PIN_SIZE = 67;
const BORDER_WIDTH = 3;
const ARROW_WIDTH = 7;
const ARROW_HEIGHT = 8;

type Props = {
  name: string;
  logo: ImageSourcePropType | null;
  themeColor: string;
  isSelected: boolean;
};

export function EventPinAndroid({ name, logo, themeColor, isSelected }: Props) {
  const borderColor = isSelected ? Colors.primary : themeColor;
  const size = isSelected ? SELECTED_PIN_SIZE : PIN_SIZE;
  const containerWidth = size + 8;
  const containerHeight = size + 8 + ARROW_HEIGHT;

  const circle = logo ? (
    <Image
      source={logo}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: BORDER_WIDTH,
        borderColor,
        backgroundColor: Colors.surface,
      }}
      resizeMode="cover"
    />
  ) : (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: BORDER_WIDTH,
        borderColor,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{
        color: Colors.text,
        fontSize: isSelected ? 26 : 22,
        fontWeight: '800',
      }}>{name.charAt(0)}</Text>
    </View>
  );

  return (
    <View style={{
      width: containerWidth,
      height: containerHeight,
      alignItems: 'center',
      }}>
      {circle}
      <View style={{
        width: 0,
        height: 0,
        borderLeftWidth: ARROW_WIDTH,
        borderRightWidth: ARROW_WIDTH,
        borderTopWidth: ARROW_HEIGHT,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: borderColor,
        marginTop: -1,
      }} />
    </View>
  );
}
