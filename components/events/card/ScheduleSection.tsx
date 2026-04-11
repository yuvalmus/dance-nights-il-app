import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { DanceLevel } from '@/constants/config';
import { formatTime } from '@/lib/date';
import DanceLevelBadge from '@/components/ui/DanceLevelBadge';

type Schedule = {
  time: string;
  description: string;
  level?: string | null;
};

type Props = {
  schedules: Schedule[];
  accentColor: string;
};

export function ScheduleSection({ schedules, accentColor }: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.labelRow}>
        <Ionicons name="calendar-outline" size={12} color={accentColor} />
        <Text style={[styles.label, { color: accentColor }]}> לו״ז</Text>
      </View>
      {schedules.map((schedule, i) => (
        <View
          key={i}
          style={[styles.row, i < schedules.length - 1 && styles.rowBorder]}
        >
          <View style={styles.timeLevelRow}>
            <Text style={[styles.time, { color: accentColor }]}>{formatTime(schedule.time)}</Text>
            {schedule.level && (
              <DanceLevelBadge
                level={schedule.level === 'open' ? null : schedule.level as DanceLevel}
                mode="icon"
                size="sm"
              />
            )}
          </View>
          <Text style={styles.desc}>{schedule.description}</Text>
        </View>
      ))}
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
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 5,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  timeLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  desc: {
    color: Colors.textSecondary,
    fontSize: 13,
    flex: 1,
    textAlign: 'right',
  },
  time: {
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
