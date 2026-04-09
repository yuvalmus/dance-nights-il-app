import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { cachedFetch, TTL } from '@/lib/cache';
import { useAuth } from '@/lib/auth';
import { Profile, Venue } from '@/types/database';
import type { EventWithSchedules } from './useVenue';

/**
 * Pre-warms the profile and venue caches as soon as the user session is
 * available, so the profile tab renders instantly without a loading state.
 * Uses the same cache keys and queries as useProfile / useVenue.
 */
export function usePrefetchProfile() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const run = async () => {
      // Profile — same key/select as useProfile
      try {
        await cachedFetch(`profile:${user.id}`, TTL.PROFILE, async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, display_name, dance_level, dance_styles')
            .eq('id', user.id)
            .single();
          if (error) throw error;
          return data as Profile;
        });
      } catch { /* silently ignore — useProfile will handle errors on mount */ }

      // Venue + events — same keys/queries as useVenue
      try {
        const venue = await cachedFetch(`venue:${user.id}`, TTL.VENUE, async () => {
          const { data, error } = await supabase
            .from('venues')
            .select('*')
            .eq('owner_id', user.id)
            .maybeSingle();
          if (error) throw error;
          return data as Venue | null;
        });

        if (venue) {
          await cachedFetch(`venue-events:${venue.id}`, TTL.VENUE_EVENTS, async () => {
            const { data, error } = await supabase
              .from('events')
              .select('*, event_schedules(*)')
              .eq('venue_id', venue.id)
              .order('date', { ascending: false });
            if (error) throw error;
            return (data ?? []) as EventWithSchedules[];
          });
        }
      } catch { /* silently ignore */ }
    };

    run();
  }, [user]);
}
