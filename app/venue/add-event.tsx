import { useState, useMemo } from 'react';
import { Alert } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useVenue } from '@/hooks/useVenue';
import EventForm, { EventFormValues } from '@/components/venue/EventForm';

export default function AddEventScreen() {
  const { user } = useAuth();
  const { venue, refetchEvents } = useVenue();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { duplicate } = useLocalSearchParams<{ duplicate?: string }>();

  const initialValues = useMemo(() => {
    if (!duplicate) return undefined;
    try {
      return JSON.parse(duplicate) as Partial<EventFormValues>;
    } catch {
      return undefined;
    }
  }, [duplicate]);

  const pickImage = async (): Promise<string | null> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return null;
    return result.assets[0].uri;
  };

  const handleSubmit = async (values: EventFormValues) => {
    if (!venue || !user) return;

    setLoading(true);
    try {
      let posterUrl: string | null = null;

      // Upload poster if selected
      if (values.posterUri && values.posterChanged) {
        const ext = values.posterUri.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `${venue.id}/${Date.now()}.${ext}`;

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
      }

      // Insert event
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          venue_id: venue.id,
          created_by: user.id,
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
        .select()
        .single();

      if (eventError) throw eventError;

      // Insert schedules
      if (values.schedules.length > 0) {
        const schedules = values.schedules.map((s, i) => ({
          event_id: event.id,
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
      console.error('Error adding event:', err);
      Alert.alert('שגיאה', 'לא הצלחנו להוסיף את האירוע. נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: initialValues ? 'שכפול אירוע' : 'אירוע חדש' }} />
      <EventForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onPickImage={pickImage}
        submitLabel="הוסף אירוע"
        loading={loading}
      />
    </>
  );
}
