import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Venue, Event, EventSchedule } from '@/types/database';
import { useAuth } from '@/lib/auth';
import { cachedFetch, invalidate, invalidateByPrefix, TTL } from '@/lib/cache';

export type EventWithSchedules = Event & {
  event_schedules: EventSchedule[];
};

export function useVenue() {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [venueEvents, setVenueEvents] = useState<EventWithSchedules[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const venueCacheKey = user ? `venue:${user.id}` : '';
  const eventsCacheKey = venue ? `venue-events:${venue.id}` : '';

  const fetchVenue = useCallback(async () => {
    if (!user) {
      setVenue(null);
      setVenueEvents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const venueData = await cachedFetch(venueCacheKey, TTL.VENUE, async () => {
        const { data, error } = await supabase
          .from('venues')
          .select('*')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (error) throw error;
        return data;
      });

      setVenue(venueData);

      if (venueData) {
        const eventsKey = `venue-events:${venueData.id}`;
        const eventsData = await cachedFetch(eventsKey, TTL.VENUE_EVENTS, async () => {
          const { data, error } = await supabase
            .from('events')
            .select('*, event_schedules(*)')
            .eq('venue_id', venueData.id)
            .order('date', { ascending: false });

          if (error) throw error;
          return (data ?? []) as EventWithSchedules[];
        });

        setVenueEvents(eventsData);
      }
    } catch (err: any) {
      console.error('Error fetching venue:', err);
    } finally {
      setLoading(false);
    }
  }, [user, venueCacheKey]);

  useEffect(() => {
    fetchVenue();
  }, [fetchVenue]);

  const refetchEvents = useCallback(async () => {
    if (!venue) return;

    const key = `venue-events:${venue.id}`;
    invalidate(key);
    invalidateByPrefix('events:');

    try {
      const { data, error } = await supabase
        .from('events')
        .select('*, event_schedules(*)')
        .eq('venue_id', venue.id)
        .order('date', { ascending: false });

      if (error) throw error;

      const events = (data ?? []) as EventWithSchedules[];
      setVenueEvents(events);

      // Write fresh data back into cache
      cachedFetch(key, TTL.VENUE_EVENTS, async () => events);
    } catch (err: any) {
      console.error('Error refetching events:', err);
    }
  }, [venue]);

  const toggleEventPublish = useCallback(async (eventId: string, isPublished: boolean) => {
    const { error } = await supabase
      .from('events')
      .update({ is_published: !isPublished })
      .eq('id', eventId);

    if (error) throw error;
    await refetchEvents();
  }, [refetchEvents]);

  const deleteEvent = useCallback(async (eventId: string) => {
    await supabase
      .from('event_schedules')
      .delete()
      .eq('event_id', eventId);

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) throw error;
    await refetchEvents();
  }, [refetchEvents]);

  return {
    venue,
    venueEvents,
    loading,
    refetchEvents,
    toggleEventPublish,
    deleteEvent,
  };
}
