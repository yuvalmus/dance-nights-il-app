import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import CourseDetailsScreen from '@/components/courses/details/CourseDetailsScreen';
import { isValidCourseId } from '@/lib/courseShare';
import { approveCourse, rejectCourse } from '@/lib/courseApprovalService';

/**
 * Venue-owner approval view for a pending course. Reuses the public course
 * details layout but shows V/X actions in the header instead of
 * share/calendar, and fetches unpublished rows so the pending course is
 * actually visible.
 */
export default function CourseApproveRoute() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const validId = typeof courseId === 'string' && isValidCourseId(courseId) ? courseId : undefined;
  const [submitting, setSubmitting] = useState(false);

  const handleApprove = useCallback(() => {
    if (!validId || submitting) return;
    Alert.alert(
      'לאשר את הקורס?',
      'הקורס יפורסם תחת המקום שלך.',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'אישור',
          onPress: async () => {
            setSubmitting(true);
            try {
              await approveCourse(validId);
              router.back();
            } catch (err) {
              console.error('Approve course failed:', err);
              Alert.alert('שגיאה', 'לא ניתן לאשר את הקורס כעת');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  }, [validId, submitting, router]);

  const handleReject = useCallback(() => {
    if (!validId || submitting) return;
    Alert.alert(
      'לדחות את הקורס?',
      'הקורס לא יפורסם תחת המקום שלך עד אישור עתידי.',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'דחייה',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              await rejectCourse(validId);
              router.back();
            } catch (err) {
              console.error('Reject course failed:', err);
              Alert.alert('שגיאה', 'לא ניתן לדחות את הקורס כעת');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  }, [validId, submitting, router]);

  return (
    <>
      <Stack.Screen options={{ title: 'אישור קורס' }} />
      <CourseDetailsScreen
        courseId={validId}
        mode="approval"
        onApprove={handleApprove}
        onReject={handleReject}
        approvalLoading={submitting}
      />
    </>
  );
}
