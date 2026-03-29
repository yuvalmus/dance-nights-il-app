import { useState, useEffect, useRef } from 'react';
import { Alert, ActivityIndicator, View, TouchableOpacity } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useVenue } from '@/hooks/useVenue';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@/components/ui/Icon';
import EventForm, { EventFormValues } from '@/components/venue/EventForm';
import type { Event, EventSchedule } from '@/types/database';
import { formatTime } from '@/lib/date';

type EventWithSchedules = Event & { event_schedules: EventSchedule[] };

export default function EditEventScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { refetchEvents } = useVenue();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [initialValues, setInitialValues] = useState<Partial<EventFormValues> | null>(null);
  const submitRef = useRef<(() => void) | null>(null);
  const [originalPosterUrl, setOriginalPosterUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;

    (async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*, event_schedules(*)')
        .eq('id', eventId)
        .single();

      if (error || !data) {
        Alert.alert('שגיאה', 'לא הצלחנו לטעון את האירוע.');
        router.back();
        return;
      }

      const event = data as EventWithSchedules;
      setOriginalPosterUrl(event.poster_url);

      setInitialValues({
        title: event.title,
        description: event.description || '',
        date: event.date,
        dance_styles: event.dance_styles,
        schedules: event.event_schedules
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((s) => ({
            time: formatTime(s.time),
            description: s.description,
            level: s.level || '',
          })),
        posterUri: event.poster_url,
        posterChanged: false,
        price: event.price != null ? String(event.price) : '',
        price_note: event.price_note || '',
        dj: event.dj || '',
        instructors: event.instructors,
        pre_register: event.pre_register,
        registration_link: event.registration_link || '',
        spots_total: event.spots_total ? String(event.spots_total) : '',
        is_published: event.is_published,
      });
      setFetching(false);
    })();
  }, [eventId]);

  const pickImage = async (): Promise<string | null> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return null;
    return result.assets[0].uri;
  };

  const handleSubmit = async (values: EventFormValues) => {
    if (!eventId) return;

    setLoading(true);
    try {
      let posterUrl: string | null = values.posterUri;

      // Handle poster change
      if (values.posterChanged) {
        // Delete old poster from storage if it exists
        if (originalPosterUrl) {
          const oldPath = originalPosterUrl.split('/posters/')[1];
          if (oldPath) {
            await supabase.storage.from('posters').remove([oldPath]);
          }
        }

        // Upload new poster
        if (values.posterUri) {
          const ext = values.posterUri.split('.').pop()?.toLowerCase() || 'jpg';
          const path = `${Date.now()}.${ext}`;

          const formData = new FormData();
          formData.append('file', {
            uri: values.posterUri,
            name: `poster.${ext}`,
            type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
          } as any);

          const { error: uploadError } = await supabase.storage
            .from('posters')
            .upload(path, formData, { contentType: 'multipart/form-data' });

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from('posters')
            .getPublicUrl(path);

          posterUrl = urlData.publicUrl;
        } else {
          posterUrl = null;
        }
      }

      // Update event
      const { error: eventError } = await supabase
        .from('events')
        .update({
          title: values.title,
          description: values.description || null,
          date: values.date,
          dance_styles: values.dance_styles,
          poster_url: posterUrl,
          price: values.price ? parseInt(values.price, 10) : null,
          price_note: values.price_note || null,
          dj: values.dj || null,
          instructors: values.instructors,
          pre_register: values.pre_register,
          registration_link: values.registration_link || null,
          spots_total: values.spots_total ? parseInt(values.spots_total, 10) : null,
          is_published: values.is_published,
        })
        .eq('id', eventId);

      if (eventError) throw eventError;

      // Replace schedules: delete old, insert new
      const { error: deleteError } = await supabase
        .from('event_schedules')
        .delete()
        .eq('event_id', eventId);

      if (deleteError) throw deleteError;

      if (values.schedules.length > 0) {
        const schedules = values.schedules.map((s, i) => ({
          event_id: eventId,
          time: s.time,
          description: s.description,
          level: s.level || null,
          sort_order: i,
        }));

        const { error: schedError } = await supabase
          .from('event_schedules')
          .insert(schedules);

        if (schedError) throw schedError;
      }

      await refetchEvents();
      router.back();
    } catch (err: any) {
      console.error('Error updating event:', err);
      Alert.alert('שגיאה', 'לא הצלחנו לעדכן את האירוע. נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <Stack.Screen options={{ title: 'עריכת אירוע' }} />
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'עריכת אירוע',
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
      <EventForm
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
