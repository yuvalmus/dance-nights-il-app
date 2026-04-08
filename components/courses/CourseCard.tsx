import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@/components/ui/Icon';
import { Colors } from '@/constants/colors';
import { DanceLevel } from '@/constants/config';
import DanceLevelBadge from '@/components/ui/DanceLevelBadge';
import { isNewCourse, formatCourseDateRange } from '@/lib/date';
import { CoursePosterOverlay } from '@/components/courses/CoursePosterOverlay';
import { CourseWithVenue } from '@/hooks/useCourses';

type Props = {
  course: CourseWithVenue;
  onPress?: () => void;
};

export function CourseCard({ course, onPress }: Props) {
  const isNew = isNewCourse(course.created_at);
  const dates = formatCourseDateRange(course.dates);
  const level = (course.level as DanceLevel) ?? null;

  const venueName = course.venues?.name ?? null;
  const venueCity = course.venues?.city ?? null;
  const locationText = [venueName, venueCity].filter(Boolean).join(', ');

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      {/* Poster */}
      {course.poster_url ? (
        <View style={styles.posterContainer}>
          <Image
            source={{ uri: course.poster_url }}
            style={styles.poster}
            contentFit="cover"
            transition={200}
          />
          <CoursePosterOverlay isNew={isNew} danceStyle={course.dance_style} />
        </View>
      ) : (
        <View style={[styles.posterContainer, styles.posterPlaceholder]}>
          <Ionicons name="musical-notes" size={40} color={Colors.textMuted} />
          <CoursePosterOverlay isNew={isNew} danceStyle={course.dance_style} />
        </View>
      )}

      {/* Accent divider */}
      <View style={styles.accentDivider} />

      {/* Content */}
      <View style={styles.content}>
        {/* Level & Dates row */}
        <View style={styles.metaRow}>
          <DanceLevelBadge level={level} size="md" mode='full' />
          {dates && <Text style={styles.metaText}>{dates}</Text>}
        </View>

        {/* Title */}
        <Text style={styles.title}>{course.title}</Text>

        {/* Instructor */}
        {course.instructor && (
          <View style={styles.instructorRow}>
            <Text style={styles.instructorText}>{course.instructor}</Text>
            <Ionicons name="people-outline" size={13} color={Colors.textSecondary} />
          </View>
        )}

        {/* Location */}
        {locationText.length > 0 && (
          <View style={styles.locationRow}>
            <Text style={styles.locationText}>{locationText}</Text>
            <Ionicons name="location-sharp" size={14} color={Colors.textSecondary} />
          </View>
        )}

        {/* CTA Button */}
        <View style={styles.ctaButton}>
          <Text style={styles.ctaText}>להרשמה עכשיו!</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.15)',
    // Elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  posterContainer: {
    width: '100%',
    height: 240,
    position: 'relative',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  posterPlaceholder: {
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentDivider: {
    height: 1.5,
    backgroundColor: 'rgba(212, 160, 23, 0.25)',
  },
  content: {
    padding: 16,
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  title: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 2,
  },
  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 2,
  },
  instructorText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  ctaButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  ctaText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '800',
  },
});
