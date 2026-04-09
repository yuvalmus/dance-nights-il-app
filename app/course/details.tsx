import { useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router';
import CourseDetailsScreen from '@/components/courses/details/CourseDetailsScreen';

export default function CourseDetailsRoute() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();

  return (
    <>
      <Stack.Screen options={{ title: 'פרטי קורס' }} />
      <CourseDetailsScreen courseId={courseId} />
    </>
  );
}
