import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { EventWithVenue } from '@/types/database';
import { getUserLocation } from '@/lib/location';
import { cachedFetch, invalidate, TTL } from '@/lib/cache';

export function useEvents(date: string) {
  const [events, setEvents] = useState<EventWithVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = `events:${date}`;

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await cachedFetch(cacheKey, TTL.EVENTS, async () => {
        const location = await getUserLocation();
        const { data, error: rpcError } = await supabase.rpc(
          'get_events_by_date_and_distance',
          { target_date: date, user_lat: location.latitude, user_lng: location.longitude },
        );
        if (rpcError) throw rpcError;
        return data ?? [];
      });

      setEvents(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  }, [cacheKey]);

  // Re-run on screen focus. If cache is valid, returns instantly from memory.
  // If cache was invalidated (e.g. after an edit), fetches fresh data.
  useFocusEffect(useCallback(() => { fetchEvents(); }, [fetchEvents]));

  const refetch = useCallback(() => {
    invalidate(cacheKey);
    return fetchEvents();
  }, [cacheKey, fetchEvents]);

  return { events, loading, error, refetch };
}
