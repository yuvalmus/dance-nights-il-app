import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { useNavigation } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useCourseDetails } from '@/hooks/useCourseDetails';
import { openNavigation } from '@/lib/navigation';
import { shareCourseLink } from '@/lib/courseShare';
import { addCourseSchedulesToCalendar } from '@/lib/courseCalendar';
import CourseHeroPoster from './CourseHeroPoster';
import CourseMetaSection from './CourseMetaSection';
import CourseStructureAccordion from './CourseStructureAccordion';
import CourseAnnouncementsSection from './CourseAnnouncementsSection';
import CourseLearningSection from './CourseLearningSection';
import { AddressBox } from '@/components/events/card/AddressBox';
import CourseBottomBar from './CourseBottomBar';
import CourseHeaderActions from './CourseHeaderActions';
import CourseApprovalHeaderActions from './CourseApprovalHeaderActions';

type CourseDetailsMode = 'public' | 'approval';

type Props = {
  courseId: string | undefined;
  /**
   * `public` (default) — standard viewer UI with share/calendar header.
   * `approval` — venue-owner approval UI: swap header for V/X buttons and
   * fetch unpublished rows so pending courses are visible.
   */
  mode?: CourseDetailsMode;
  onApprove?: () => void;
  onReject?: () => void;
  approvalLoading?: boolean;
};

export default function CourseDetailsScreen({
  courseId,
  mode = 'public',
  onApprove,
  onReject,
  approvalLoading,
}: Props) {
  const navigation = useNavigation();
  const isApproval = mode === 'approval';
  const { course, loading, error } = useCourseDetails(courseId, {
    includeUnpublished: isApproval,
  });
  const [calendarLoading, setCalendarLoading] = useState(false);

  const handleShare = useCallback(() => {
    if (!course) return;
    shareCourseLink({ courseId: course.id, title: course.title });
  }, [course]);

  const handleAddToCalendar = useCallback(() => {
    if (!course) return;
    const count = course.course_schedules.length;
    const sessionsText = count === 1 ? 'מפגש אחד' : `${count} מפגשים`;
    Alert.alert(
      'הוספה ללוח שנה',
      `יתווספו ${sessionsText} של "${course.title}" ללוח השנה שלך.`,
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'הוסף',
          onPress: async () => {
            setCalendarLoading(true);
            try {
              const result = await addCourseSchedulesToCalendar(
                course.course_schedules,
                course.title,
                course.id,
                course.venues,
              );
              const total = result.created + result.failed;
              const message =
                result.failed === 0
                  ? `נוצרו ${result.created} אירועים בלוח השנה`
                  : `נוצרו ${result.created} מתוך ${total} אירועים`;
              Alert.alert('לוח שנה', message);
            } catch (err: any) {
              if (err.message === 'permission_denied') {
                Alert.alert('נדרשת הרשאה', 'יש לאפשר גישה ללוח השנה בהגדרות המכשיר');
              } else if (err.message === 'no_calendar') {
                Alert.alert('שגיאה', 'לא נמצא לוח שנה זמין במכשיר');
              } else {
                Alert.alert('שגיאה', 'לא ניתן להוסיף אירועים ללוח השנה');
              }
            } finally {
              setCalendarLoading(false);
            }
          },
        },
      ],
    );
  }, [course]);

  useEffect(() => {
    if (!course) return;
    navigation.setOptions({
      headerLeft: () =>
        isApproval ? (
          <CourseApprovalHeaderActions
            onApprove={() => onApprove?.()}
            onReject={() => onReject?.()}
            loading={approvalLoading}
          />
        ) : (
          <CourseHeaderActions
            onShare={handleShare}
            onAddToCalendar={handleAddToCalendar}
            calendarLoading={calendarLoading}
            calendarDisabled={course.course_schedules.length === 0}
          />
        ),
    });
  }, [
    course,
    navigation,
    handleShare,
    handleAddToCalendar,
    calendarLoading,
    isApproval,
    onApprove,
    onReject,
    approvalLoading,
  ]);

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
