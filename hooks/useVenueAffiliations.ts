/**
 * useVenueAffiliations — owner-side view.
 *
 * Lists pending invites and active instructors for the caller's venue, and
 * exposes invite/revoke helpers. Pairs with `useAffiliations` (instructor
 * side) so the responsibilities never bleed into a single oversized hook.
 */

import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { cachedFetch, TTL } from '@/lib/cache';
import { VenueAffiliation } from '@/types/database';
import {
  inviteInstructor,
  revokeAffiliation,
} from '@/lib/affiliationService';

// Light profile fields the owner needs to identify instructors in the UI.
type InstructorProfile = {
  id: string;
  display_name: string | null;
  is_artist: boolean;
};

export type OwnerAffiliation = VenueAffiliation & {
  profiles: InstructorProfile | null;
};

const PROFILE_SELECT = 'id, display_name, is_artist';

export function useVenueAffiliations(venueId: string | undefined) {
  const [items, setItems] = useState<OwnerAffiliation[]>([]);
  const [loading, setLoading] = useState(true);

  const cacheKey = venueId ? `venue-affiliations:${venueId}` : '';

  const fetchItems = useCallback(async () => {
    if (!venueId) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await cachedFetch(cacheKey, TTL.AFFILIATIONS, async () => {
        // Two-step fetch: PostgREST can't disambiguate profiles ↔ auth.users
        // since both profiles.id and venue_affiliations.user_id reference the
        // same auth.users.id. Splitting keeps the query unambiguous and is a
        // flat 2 round-trips — fine for the owner's (small) instructor list.
        const { data: affiliations, error } = await supabase
          .from('venue_affiliations')
          .select('*')
          .eq('venue_id', venueId)
          .in('status', ['pending', 'active'])
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (!affiliations || affiliations.length === 0) return [];

        const userIds = affiliations.map((a) => a.user_id);
        const { data: profiles, error: pErr } = await supabase
          .from('profiles')
          .select(PROFILE_SELECT)
          .in('id', userIds);

        if (pErr) throw pErr;

        const byId = new Map((profiles ?? []).map((p) => [p.id, p as InstructorProfile]));
        return affiliations.map((a) => ({
          ...a,
          profiles: byId.get(a.user_id) ?? null,
        })) as OwnerAffiliation[];
      });
      setItems(data);
    } catch (err) {
      console.error('Error fetching venue affiliations:', err);
    } finally {
      setLoading(false);
    }
  }, [venueId, cacheKey]);

  useFocusEffect(useCallback(() => { fetchItems(); }, [fetchItems]));

  const invite = useCallback(
    async (instructorUserId: string, ownerId: string) => {
      if (!venueId) return;
      await inviteInstructor({
        venueId,
        userId: instructorUserId,
        invitedBy: ownerId,
      });
      await fetchItems();
    },
    [venueId, fetchItems],
  );

  const revoke = useCallback(
    async (affiliationId: string) => {
      await revokeAffiliation(affiliationId);
      await fetchItems();
    },
    [fetchItems],
  );

  return {
    pending: items.filter((a) => a.status === 'pending'),
    active: items.filter((a) => a.status === 'active'),
    loading,
    invite,
    revoke,
    refetch: fetchItems,
  };
}
