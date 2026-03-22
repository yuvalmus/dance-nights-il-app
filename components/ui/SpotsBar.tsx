import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

type Props = {
  total: number;
  taken: number;
};

export function SpotsBar({ total, taken }: Props) {
  const remaining = Math.max(0, total - taken);
  const percentage = total > 0 ? (taken / total) * 100 : 0;
  const isAlmostFull = percentage >= 80;

  return (
    <View style={styles.container}>
      <View style={styles.barBg}>
        <View
          style={[
            styles.barFill,
            {
              width: `${Math.min(100, percentage)}%`,
              backgroundColor: isAlmostFull ? Colors.error : Colors.success,
            },
          ]}
        />
      </View>
      <Text style={[styles.text, isAlmostFull && styles.textUrgent]}>
        {remaining} פנויים
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginVertical: 8,
    paddingHorizontal: 18,
  },
  barBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  text: {
    color: Colors.success,
    fontSize: 12,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'left',
  },
  textUrgent: {
    color: Colors.error,
  },
});
