import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

type Props = {
  total: number;
  taken: number;
};

export type UrgencyLevel = 'calm' | 'warning' | 'urgent' | 'critical' | 'closed';

export function getUrgency(total: number, taken: number): UrgencyLevel {
  if (total <= 0) return 'calm';
  const pct = (taken / total) * 100;
  if (pct >= 100) return 'closed';
  if (pct >= 90) return 'critical';
  if (pct >= 75) return 'urgent';
  if (pct >= 50) return 'warning';
  return 'calm';
}

export function getUrgencyText(urgency: UrgencyLevel): string {
  switch (urgency) {
    case 'calm': return 'יש עוד מקום';
    case 'warning': return 'מקומות מתחילים להיגמר';
    case 'urgent': return 'המקומות עומדים להיגמר';
    case 'critical': return 'מקומות אחרונים!';
    case 'closed': return 'הרשמה נסגרה';
  }
}

export function getUrgencyColor(urgency: UrgencyLevel): string {
  switch (urgency) {
    case 'calm': return Colors.success;
    case 'warning': return '#f5a623';
    case 'urgent': return '#e67e22';
    case 'critical': return Colors.error;
    case 'closed': return Colors.textMuted;
  }
}

export function SpotsBar({ total, taken }: Props) {
  const percentage = total > 0 ? (taken / total) * 100 : 0;
  const urgency = getUrgency(total, taken);
  const color = getUrgencyColor(urgency);
  const text = getUrgencyText(urgency);

  return (
    <View style={styles.container}>
      <View style={styles.barBg}>
        <View
          style={[
            styles.barFill,
            {
              width: `${Math.min(100, percentage)}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
      <Text style={[styles.text, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: 8,
    marginVertical: 8,
    paddingHorizontal: 18,
  },
  barBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.brighterBorder,
    overflow: 'hidden',
    alignItems: 'flex-end',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'center',
    direction: 'rtl',
  },
});
