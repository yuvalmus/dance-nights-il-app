import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

type Props = {
  name: string;
  isSelected: boolean;
};

export function EventPin({ name, isSelected }: Props) {
  const pinColor = Colors.primary;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.bubble,
          { backgroundColor: pinColor },
          isSelected && styles.bubbleSelected,
        ]}
      >
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
      </View>
      <View style={[styles.arrow, { borderTopColor: pinColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  bubble: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    maxWidth: 120,
  },
  bubbleSelected: {
    transform: [{ scale: 1.15 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  name: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
