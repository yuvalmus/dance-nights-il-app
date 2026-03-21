import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Colors } from '@/constants/colors';

export function TabBadge({ count }: { count?: number }) {
  if (count === undefined || count === 0) return null;
  const isDot = count < 0;

  return (
    <View style={[styles.badge, isDot && styles.badgeDot]}>
      {!isDot && (
        <Animated.Text style={styles.badgeText}>
          {count > 99 ? '99+' : count}
        </Animated.Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.surface,
  },

  badgeDot: {
    minWidth: 10,
    height: 10,
    borderRadius: 5,
    top: 4,
    right: 6,
    paddingHorizontal: 0,
  },

  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
});
