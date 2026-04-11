import { Colors } from '@/constants/colors';
import { ColorValue, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

const ACTIVE_DOT_SIZE = 10;
const ACTIVE_DOT_OPACITY = 1;
const INACTIVE_DOT_SIZE = 9;
const INACTIVE_DOT_OPACITY = 0.9;
const ANIMATION_DURATION = 250;

type Props = {
  isActive: boolean;
  color: ColorValue;
}

export const AnimatedDot = ({ isActive, color }: Props) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      // Transition opacity and scale
      opacity: withTiming(isActive ? ACTIVE_DOT_OPACITY : INACTIVE_DOT_OPACITY, { duration: ANIMATION_DURATION }),
      transform: [
        { scale: withTiming(isActive ? 1.2 : 1, { duration: ANIMATION_DURATION }) }
      ],
      // Transition size
      width: withTiming(isActive ? ACTIVE_DOT_SIZE : INACTIVE_DOT_SIZE, { duration: ANIMATION_DURATION }),
      height: withTiming(isActive ? ACTIVE_DOT_SIZE : INACTIVE_DOT_SIZE, { duration: ANIMATION_DURATION }),
    };
  });

  return (
    <Animated.View
      style={[
        styles.dot, 
        { backgroundColor: color },
        animatedStyle
      ]}
    />
  );
};

const styles = StyleSheet.create({
  dot: {
    borderRadius: 5,
  },
});