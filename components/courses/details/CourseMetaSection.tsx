import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { DanceLevel } from '@/constants/config';
import DanceLevelBadge from '@/components/ui/DanceLevelBadge';
import { formatCourseDateRange } from '@/lib/date';
import { CourseWithVenue } from '@/hooks/useCourses';
import { getVenueLogo } from '@/constants/venueLogos';

type Props = {
  course: CourseWithVenue;
};

export default function CourseMetaSection({ course }: Props) {
  const scheduleDates = course.course_schedules.map((s) => s.date).sort();
  const startDate = scheduleDates.length > 0
    ? formatCourseDateRange([scheduleDates[0]])
    : null;

  const level = (course.level as DanceLevel) ?? null;
  const venue = course.venues;
  const venueLogo = venue ? getVenueLogo(venue.slug) : null;
  const venueColor = venue?.theme_colors?.[0] ?? Colors.textSecondary;

  return (
    <View style={styles.container}>
      {/* Instructor */}
      {course.instructor && (
        <View style={styles.instructorRow}>
          <Ionicons name="person" size={16} color={Colors.primary} />
          <Text style={styles.instructorText}>{course.instructor}</Text>
        </View>
      )}

      {/* Description */}
      {course.description && (
        <Text style={styles.description}>{course.description}</Text>
      )}

      {/* Venue host */}
      {venue && (
        <View style={styles.venueRow}>
          {venueLogo && (
            <Image source={venueLogo} style={styles.venueLogo} />
          )}
          <Text style={[styles.venueName, { color: venueColor }]}>{venue.name}</Text>
        </View>
      )}

      <View style={styles.divider} />

      {/* Light info blocks — side by side */}
      <View style={styles.infoRow}>
        {/* Start date block */}
        {startDate && (
          <View style={styles.infoBlock}>
            <View style={styles.infoIconRow}>
              <Ionicons name="calendar" size={18} color={Colors.primary} />
              <Text style={styles.infoLabel}>תאריך פתיחה</Text>
            </View>
            <Text style={styles.infoValue}>{startDate}</Text>
          </View>
        )}

        {/* Level block */}
        <View style={styles.infoBlock}>
          <View style={styles.infoIconRow}>
            <Text style={styles.infoLabel}>רמה</Text>
          </View>
          <DanceLevelBadge level={level} size="md" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: 16,
  },
  instructorRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  instructorText: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  venueLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  venueName: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row-reverse',
    gap: 12,
  },
  infoBlock: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  infoIconRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  infoLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  infoValue: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
