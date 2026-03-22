import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';

type Props = {
  instructors: string[];
  accentColor: string;
};

export function InstructorPills({ instructors, accentColor }: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.labelRow}>
        <Ionicons name="people-outline" size={12} color={accentColor} />
        <Text style={[styles.label, { color: accentColor }]}> מדריכים</Text>
      </View>
      <View style={styles.pills}>
        {instructors.map((inst, i) => (
          <View key={i} style={styles.pill}>
            <Text style={styles.pillText}>{inst}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  pills: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pillText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
});
