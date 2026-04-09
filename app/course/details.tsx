import { useLocalSearchParams, Stack } from 'expo-router';
import CourseDetailsScreen from '@/components/courses/details/CourseDetailsScreen';
import { isValidCourseId } from '@/lib/courseShare';

export default function CourseDetailsRoute() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const validId = typeof courseId === 'string' && isValidCourseId(courseId) ? courseId : undefined;

  return (
    <>
      <Stack.Screen options={{ title: 'פרטי קורס' }} />
      <CourseDetailsScreen courseId={validId} />
    </>
  );
}
