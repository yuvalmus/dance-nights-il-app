import { useState, useEffect, useRef } from 'react';
import { Alert, ActivityIndicator, View, TouchableOpacity } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@/components/ui/Icon';
import { updateCourse } from '@/lib/courseService';
import CourseForm, { CourseFormValues } from '@/components/courses/CourseForm';
import BackButton from '@/components/ui/BackButton';
import { formatTime } from '@/lib/date';
import type { CourseType, DanceLevel } from '@/constants/config';
import type { VenueCandidate } from '@/hooks/useVenueSearch';

/**
 * Edit-course stack screen. RLS already blocks non-creators; we additionally
 * lock the screen out for `pending_owner_review` rows so the artist cannot
 * mutate a course awaiting approval — they can only delete it.
 */
export default function EditCourseScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [initialValues, setInitialValues] = useState<Partial<CourseFormValues> | null>(null);
  const [originalPosterUrl, setOriginalPosterUrl] = useState<string | null>(null);
  // Tracks whether the row was rejected on entry — saving will trigger
  // re-approval (DB-side), so we warn the creator before submitting.
  const [wasRejected, setWasRejected] = useState(false);
  const submitRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!courseId) return;

    (async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*, venues(id, name, slug, city, logo_url, theme_colors), course_schedules(date, start_time, end_time, description)')
        .eq('id', courseId)
        .single();

      if (error || !data) {
        Alert.alert('שגיאה', 'לא הצלחנו לטעון את הקורס.');
        router.back();
        return;
      }

      if (data.approval_status === 'pending_owner_review') {
        Alert.alert('לא ניתן לערוך', 'הקורס ממתין לאישור בעל המקום. ניתן רק למחוק אותו.');
        router.back();
        return;
      }

      setOriginalPosterUrl(data.poster_url);
      setWasRejected(data.approval_status === 'rejected');

      const venue: VenueCandidate | null = data.venues
        ? {
            id: data.venues.id,
            name: data.venues.name,
            slug: data.venues.slug,
            city: data.venues.city,
            logo_url: data.venues.logo_url,
            theme_colors: data.venues.theme_colors,
          }
        : null;

      setInitialValues({
        title: data.title,
        description: data.description || '',
        type: data.type as CourseType,
        dance_style: data.dance_style || '',
        level: (data.level as DanceLevel) || '',
        instructor: data.instructor || '',
        instructor_id: data.instructor_id,
        venue,
        price: data.price != null ? String(data.price) : '',
        spots_total: data.spots_total != null ? String(data.spots_total) : '',
        registration_url: data.registration_url || '',
        is_published: data.is_published,
        announcements: data.announcements || [],
        learning_outcomes: data.learning_outcomes || [],
        posterUri: data.poster_url,
        posterChanged: false,
        schedules: (data.course_schedules || [])
          .slice()
          .sort((a: any, b: any) => a.date.localeCompare(b.date))
          .map((s: any) => ({
            date: s.date,
            start_time: formatTime(s.start_time),
            end_time: formatTime(s.end_time),
            description: s.description || '',
          })),
      });
      setFetching(false);
    })();
  }, [courseId]);

  const pickImage = async (): Promise<string | null> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return null;
    return result.assets[0].uri;
  };

  const performUpdate = async (values: CourseFormValues) => {
    if (!courseId || !user) return;
    setLoading(true);
    try {
      await updateCourse({ values, courseId, userId: user.id, originalPosterUrl });
      router.back();
    } catch (err: any) {
      console.error('Error updating course:', err);
      Alert.alert('שגיאה', 'לא הצלחנו לעדכן את הקורס. נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: CourseFormValues) => {
    // Saving a rejected course re-submits it for approval. Warn the creator
    // up-front since they won't be able to edit again until the venue owner
    // responds — we'd rather they cancel and keep tweaking than get stuck.
    if (wasRejected) {
      Alert.alert(
        'שליחה לאישור מחדש',
        'שמירת השינויים תשלח את הקורס לאישור בעל המקום מחדש. עד לתשובתו לא ניתן יהיה לערוך אותו שוב. האם להמשיך?',
        [
          { text: 'בטל ושנה', style: 'cancel' },
          {
            text: 'שלח לאישור',
            onPress: () => {
              performUpdate(values);
            },
          },
        ],
      );
      return;
    }
    await performUpdate(values);
  };

  if (fetching) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <Stack.Screen options={{ title: 'עריכת קורס', headerRight: () => <BackButton /> }} />
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'עריכת קורס',
          headerRight: () => <BackButton />,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => submitRef.current?.()}
              disabled={loading}
              style={{ padding: 4 }}
            >
              <Ionicons name="checkmark" size={26} color={Colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <CourseForm
        initialValues={initialValues ?? undefined}
        onSubmit={handleSubmit}
        onPickImage={pickImage}
        submitLabel="שמור שינויים"
        loading={loading}
        onSubmitRef={submitRef}
      />
    </>
  );
}
