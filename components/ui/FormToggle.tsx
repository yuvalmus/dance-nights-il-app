import { useRef, useCallback } from 'react';
import { View, Text, Switch, Pressable, Animated, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

type FormToggleProps = {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

export default function FormToggle({ label, description, value, onValueChange }: FormToggleProps) {
  const flashAnim = useRef(new Animated.Value(0)).current;

  const handlePress = useCallback(() => {
    onValueChange(!value);
    flashAnim.setValue(1);
    Animated.timing(flashAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [value, onValueChange, flashAnim]);

  const borderColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.border, Colors.primary],
  });

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[styles.container, { borderColor }]}>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: Colors.border, true: Colors.primary }}
          thumbColor={Colors.text}
          style={{ transform: [{ scaleX: -1 }] }}
          pointerEvents="none"
        />
        <View style={styles.textContainer}>
          <Text style={styles.label}>{label}</Text>
          {description && <Text style={styles.description}>{description}</Text>}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  textContainer: {
    flex: 1,
    alignItems: 'flex-end',
    marginLeft: 16,
  },
  label: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  description: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
    textAlign: 'right',
  },
});
