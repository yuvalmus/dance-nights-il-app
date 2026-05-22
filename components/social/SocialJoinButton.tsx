import { useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';

type Props = {
  joined: boolean;
  busy: boolean;
  /** Label shown before the viewer joins. */
  labelDefault: string;
  /** Label shown after the viewer joins (a ✓ icon is appended automatically). */
  labelJoined: string;
  /** Optional Ionicons name shown on the leading edge while not joined. */
  leadingIcon?: string;
  onPress: () => void;
};

/**
 * The primary "join" CTA for the social block. Gold while it's an invitation,
 * green once the viewer has committed — the colour transition is the core
 * micro-interaction ("my tap changed something").
 */
export default function SocialJoinButton({
  joined,
  busy,
  labelDefault,
  labelJoined,
  leadingIcon,
  onPress,
}: Props) {
  const anim = useRef(new Animated.Value(joined ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: joined ? 1 : 0,
      duration: 260,
      useNativeDriver: false, // backgroundColor isn't native-drivable
    }).start();
  }, [joined, anim]);

  const backgroundColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.primary, Colors.success],
  });

  // Gold needs the dark text for contrast; green carries white.
  const textColor = joined ? '#ffffff' : Colors.background;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} disabled={busy}>
      <Animated.View
        style={[
          styles.button,
          { backgroundColor },
          !joined && styles.glow,
        ]}
      >
        {busy ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <>
            {!joined && leadingIcon && (
              <Ionicons name={leadingIcon} size={18} color={textColor} />
            )}
            <Text style={[styles.label, { color: textColor }]}>
              {joined ? labelJoined : labelDefault}
            </Text>
            {joined && (
              <Ionicons name="checkmark" size={20} color={textColor} />
            )}
          </>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  glow: {
    shadowColor: Colors.primaryLight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 6,
  },
  label: {
    fontSize: 16,
    fontWeight: '800',
  },
});
