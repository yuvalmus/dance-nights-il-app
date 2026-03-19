import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { EventWithVenue } from '@/types/database';
import { getUserLocation, DEFAULT_LOCATION } from '@/lib/location';

export function useEvents(date: string) {
  const [events, setEvents] = useState<EventWithVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const location = await getUserLocation();

      const { data, error: rpcError } = await supabase.rpc(
        'get_events_by_date_and_distance',
        {
          target_date: date,
          user_lat: location.latitude,
          user_lng: location.longitude,
        }
      );

      if (rpcError) throw rpcError;
      setEvents(data ?? []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, loading, error, refetch: fetchEvents };
}

// Filter events by dance style
export function filterEventsByStyle(
  events: EventWithVenue[],
  style: string | null
): EventWithVenue[] {
  if (!style) return events;
  return events.filter((e) => e.dance_styles.includes(style));
}
