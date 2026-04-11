import { useState, useEffect, useRef } from 'react';
import { Alert, ActivityIndicator, View, TouchableOpacity } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useVenue } from '@/hooks/useVenue';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@/components/ui/Icon';
import { updateEvent } from '@/lib/eventService';
import EventForm, { EventFormValues } from '@/components/venue/EventForm';
import BackButton from '@/components/ui/BackButton';
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

      const links = (event.registration_links as any[] || []).map((l: any) => ({
        label: l.label || '',
        url: l.url || '',
        spots_total: l.spots_total != null ? String(l.spots_total) : '',
        spots_taken: l.spots_taken != null ? String(l.spots_taken) : '0',
      }));

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
        registration_links: links,
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
      await updateEvent({ values, eventId, originalPosterUrl });
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
        <Stack.Screen options={{ title: 'עריכת אירוע', headerRight: () => <BackButton /> }} />
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'עריכת אירוע',
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
