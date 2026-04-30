/**
 * useAffiliations — instructor-side view of venue affiliations.
 *
 * Surfaces pending invites and active affiliations for the signed-in user,
 * with helpers to accept / decline / leave. Owner-side flows live in
 * `useVenueAffiliations` to keep each hook narrow.
 */

import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { cachedFetch, TTL } from '@/lib/cache';
import { VenueAffiliation } from '@/types/database';
import {
  acceptInvite as acceptInviteCall,
  revokeAffiliation,
} from '@/lib/affiliationService';

// Minimal venue shape needed for the UI — name, slug, logo. Kept here because
// it's only consumed by affiliation surfaces.
type AffiliationVenue = {
  id: string;
  name: string;
  slug: string;
  city: string;
  logo_url: string | null;
  theme_colors: string[];
};

export type AffiliationWithVenue = VenueAffiliation & {
  venues: AffiliationVenue | null;
};

const VENUE_SELECT = 'id, name, slug, city, logo_url, theme_colors';

export function useAffiliations() {
  const { user } = useAuth();
  const [items, setItems] = useState<AffiliationWithVenue[]>([]);
  const [loading, setLoading] = useState(true);

  const cacheKey = user ? `affiliations:${user.id}` : '';

  const fetchItems = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await cachedFetch(cacheKey, TTL.AFFILIATIONS, async () => {
        const { data, error } = await supabase
          .from('venue_affiliations')
          .select(`*, venues(${VENUE_SELECT})`)
          .eq('user_id', user.id)
          .in('status', ['pending', 'active'])
          .order('created_at', { ascending: false });

        if (error) throw error;
        return (data ?? []) as AffiliationWithVenue[];
      });
      setItems(data);
    } catch (err) {
      console.error('Error fetching affiliations:', err);
    } finally {
      setLoading(false);
    }
  }, [user, cacheKey]);

  useFocusEffect(useCallback(() => { fetchItems(); }, [fetchItems]));

  const accept = useCallback(async (affiliationId: string) => {
    await acceptInviteCall(affiliationId);
    await fetchItems();
  }, [fetchItems]);

  const decline = useCallback(async (affiliationId: string) => {
    // Declining is the same DB transition as leaving — revoked.
    await revokeAffiliation(affiliationId);
    await fetchItems();
  }, [fetchItems]);

  const leave = useCallback(async (affiliationId: string) => {
    await revokeAffiliation(affiliationId);
    await fetchItems();
  }, [fetchItems]);

  // Split for convenient consumption.
  const pendingInvites = items.filter((a) => a.status === 'pending');
  const activeAffiliations = items.filter((a) => a.status === 'active');

  return {
    pendingInvites,
    activeAffiliations,
    loading,
    accept,
    decline,
    leave,
    refetch: fetchItems,
  };
}
