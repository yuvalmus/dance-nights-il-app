import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { getDayName, HEBREW_DAYS } from '@/lib/date';
import { CourseSchedule } from '@/types/database';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ScheduleItem = Pick<CourseSchedule, 'date' | 'start_time' | 'end_time' | 'description'>;

type Props = {
  schedules: ScheduleItem[];
};

function formatTime(t: string) {
  return t.slice(0, 5);
}

function formatSessionDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function sortSchedules(items: ScheduleItem[]): ScheduleItem[] {
  return [...items].sort((a, b) => a.date.localeCompare(b.date));
}

export default function CourseStructureAccordion({ schedules }: Props) {
  const [expanded, setExpanded] = useState(false);

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  }, []);

  if (schedules.length === 0) return null;

  const sorted = sortSchedules(schedules);
  const sessionCount = schedules.length;

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        {/* Accent gradient stripe on right side */}
        <LinearGradient
          colors={[Colors.primaryLight, Colors.primaryDark]}
          style={styles.accentStripe}
        />

        {/* Header — pressable to toggle */}
        <TouchableOpacity style={styles.header} onPress={toggle} activeOpacity={0.7}>
          <View style={styles.headerRight}>
            <Ionicons name="diamond-outline" size={18} color={Colors.primary} />
            <Text style={styles.headerTitle}>מבנה הקורס</Text>
          </View>
          <View style={styles.headerLeft}>
            <Text style={styles.sessionCount}>
              {sessionCount} {sessionCount === 1 ? 'מפגש' : 'מפגשים'}
            </Text>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={Colors.textSecondary}
            />
          </View>
        </TouchableOpacity>

        {/* Body — schedule rows, inside the same card */}
        {expanded && (
          <View style={styles.body}>
            <View style={styles.divider} />
            {sorted.map((s, i) => {
              const hasDescription = !!s.description;
              return (
                <View key={i} style={[styles.sessionRow, !hasDescription && styles.sessionRowCentered]}>
                  <View style={[styles.indexCircle, hasDescription && styles.indexCircleWithDesc]}>
                    <Text style={styles.indexText}>{i + 1}</Text>
                  </View>
                  <View style={styles.sessionContent}>
                    <View style={styles.sessionMain}>
                      <Text style={styles.sessionDay}>
                        {getDayName(s.date, true)}
                      </Text>
                      <View style={styles.dot} />
                      <Text style={styles.sessionDate}>{formatSessionDate(s.date)}</Text>
                      <View style={styles.dot} />
                      <Text style={styles.sessionTime}>
                        {formatTime(s.start_time)}-{formatTime(s.end_time)}
                      </Text>
                    </View>
                    {hasDescription && (
                      <Text style={styles.sessionNote}>{s.description}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    position: 'relative',
  },
  accentStripe: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingRight: 20,
  },
  headerRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionCount: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 14,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 2,
  },
  sessionRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 12,
  },
  sessionRowCentered: {
    alignItems: 'center',
  },
  indexCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(212, 160, 23, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexCircleWithDesc: {
    marginTop: 2,
  },
  indexText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  sessionContent: {
    flex: 1,
    gap: 4,
  },
  sessionMain: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  sessionDay: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textMuted,
  },
  sessionDate: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  sessionTime: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  sessionNote: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
    fontStyle: 'italic',
  },
});
