import { useMemo, useState } from 'react';
import { Alert, ActivityIndicator, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/lib/auth';
import { useVenue } from '@/hooks/useVenue';
import { Colors } from '@/constants/colors';
import { createCourse } from '@/lib/courseService';
import CourseForm, { CourseFormValues } from '@/components/courses/CourseForm';
import { VenueCandidate } from '@/hooks/useVenueSearch';

/**
 * Add-course stack screen. Venue owners get their own venue pre-selected
 * so the typical flow is a single-tap confirm; artists teaching elsewhere
 * search explicitly. Creator identity comes from `auth.uid()`, which the
 * insert trigger uses to decide approval_status.
 */
export default function AddCourseScreen() {
  const { user } = useAuth();
  const { venue, loading: venueLoading } = useVenue();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const initialValues: Partial<CourseFormValues> | undefined = useMemo(() => {
    if (!venue) return undefined;
    // Pre-fill the venue picker with the owner's venue as a VenueCandidate
    // shape. Logo/theme come straight from the venue record.
    const candidate: VenueCandidate = {
      id: venue.id,
      name: venue.name,
      slug: venue.slug,
      city: venue.city,
      logo_url: venue.logo_url,
      theme_colors: venue.theme_colors,
    };
    return { venue: candidate };
  }, [venue]);

  const pickImage = async (): Promise<string | null> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return null;
    return result.assets[0].uri;
  };

  const handleSubmit = async (values: CourseFormValues) => {
    if (!user) return;
    setLoading(true);
    try {
      await createCourse({ values, userId: user.id });
      router.back();
    } catch (err: any) {
      console.error('Error creating course:', err);
      Alert.alert('שגיאה', 'לא הצלחנו להוסיף את הקורס. נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  // useCourseForm seeds its state once on mount — wait for the venue lookup
  // to settle before rendering, otherwise an owner who lands here while the
  // venue is still loading gets a blank venue field that never recovers.
  if (venueLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <Stack.Screen options={{ title: 'קורס חדש' }} />
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'קורס חדש' }} />
      <CourseForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onPickImage={pickImage}
        submitLabel="הוסף קורס"
        loading={loading}
      />
    </>
  );
}
