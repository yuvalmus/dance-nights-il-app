import { useState, useMemo } from 'react';
import { Alert } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/lib/auth';
import { useVenue } from '@/hooks/useVenue';
import { createEvent } from '@/lib/eventService';
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
      await createEvent({ values, venueId: venue.id, userId: user.id });
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
