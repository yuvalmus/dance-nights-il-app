/**
 * useVenueSearch — lightweight venue typeahead for picker UIs.
 *
 * Only selects the fields the picker renders (id, name, city, logo_url) to
 * keep payloads small, and caches by query text so repeat searches are free.
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { cachedFetch, TTL } from '@/lib/cache';

export type VenueCandidate = {
  id: string;
  name: string;
  slug: string;
  city: string;
  logo_url: string | null;
  theme_colors: string[];
};

const MAX_RESULTS = 7;
const VENUE_SELECT = 'id, name, slug, city, logo_url, theme_colors';

export function useVenueSearch(query: string) {
  const [results, setResults] = useState<VenueCandidate[]>([]);

  const fetchCandidates = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    try {
      const cacheKey = `venue-search:${trimmed.toLowerCase()}`;
      const data = await cachedFetch(cacheKey, TTL.VENUE, async () => {
        const { data, error } = await supabase
          .from('venues')
          .select(VENUE_SELECT)
          .eq('is_active', true)
          .ilike('name', `%${trimmed}%`)
          .order('name')
          .limit(MAX_RESULTS);

        if (error) throw error;
        return (data ?? []) as VenueCandidate[];
      });
      setResults(data);
    } catch (err) {
      console.error('Error fetching venue candidates:', err);
    }
  }, [query]);

  useEffect(() => { void fetchCandidates(); }, [fetchCandidates]);

  return { results, refetch: fetchCandidates };
}
