import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/colors';
import { useCourseDetails } from '@/hooks/useCourseDetails';
import { openNavigation } from '@/lib/navigation';
import CourseHeroPoster from './CourseHeroPoster';
import CourseMetaSection from './CourseMetaSection';
import CourseStructureAccordion from './CourseStructureAccordion';
import CourseAnnouncementsSection from './CourseAnnouncementsSection';
import CourseLearningSection from './CourseLearningSection';
import { AddressBox } from '@/components/events/card/AddressBox';
import CourseBottomBar from './CourseBottomBar';

type Props = {
  courseId: string | undefined;
};

export default function CourseDetailsScreen({ courseId }: Props) {
  const { course, loading, error } = useCourseDetails(courseId);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error || !course) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>לא ניתן לטעון את פרטי הקורס</Text>
      </View>
    );
  }

  const venue = course.venues;
  const announcements = course.announcements ?? [];
  const outcomes = course.learning_outcomes ?? [];
  const hasCoordinates = !!venue?.location;

  const handleNavigate = () => {
    if (!venue?.location) return;
    const loc = venue.location as { coordinates: [number, number] };
    if (loc.coordinates) {
      openNavigation(loc.coordinates[1], loc.coordinates[0], venue.name);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Hero poster with title */}
        <CourseHeroPoster posterUrl={course.poster_url} title={course.title} />

        {/* 2. Description + light info blocks (date, time, level) */}
        <CourseMetaSection course={course} />

        {/* 3. Course structure accordion */}
        <CourseStructureAccordion
          schedules={course.course_schedules}
        />

        {/* 4. What will we learn — checkpoints */}
        <CourseLearningSection outcomes={outcomes} />

        {/* 5. Announcements — standout golden cards */}
        <CourseAnnouncementsSection announcements={announcements} />

        {/* 6. Address */}
        {venue && (
          <View style={styles.addressWrap}>
            <AddressBox
              address={venue.address ?? ''}
              city={venue.city}
              hasCoordinates={hasCoordinates}
              onNavigate={handleNavigate}
            />
          </View>
        )}

        {/* Spacer for sticky bottom bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Sticky bottom: spots bar + price/register */}
      <CourseBottomBar
        price={course.price}
        registrationUrl={course.registration_url}
        spotsTotal={course.spots_total}
        spotsTaken={course.spots_taken}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingBottom: 20,
    gap: 24,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorText: {
    color: Colors.textMuted,
    fontSize: 16,
  },
  addressWrap: {
    paddingHorizontal: 20,
  },
  bottomSpacer: {
    height: 130,
  },
});
