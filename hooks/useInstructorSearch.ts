/**
 * useInstructorSearch — candidate list for owner-driven instructor invites.
 *
 * Uses a narrow RPC that returns only { id, display_name, is_artist } so
 * owners can invite both regular users and artists without opening broad
 * profile reads.
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { cachedFetch, TTL } from '@/lib/cache';

export type InstructorCandidate = {
  id: string;
  display_name: string | null;
  is_artist: boolean;
};

const MAX_RESULTS = 7;

export function useInstructorSearch(query: string) {
  const [results, setResults] = useState<InstructorCandidate[]>([]);

  const fetchCandidates = useCallback(async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setResults([]);
      return;
    }

    try {
      const cacheKey = `affiliation-candidates:${trimmedQuery.toLowerCase()}`;
      const data = await cachedFetch(cacheKey, TTL.PROFILE, async () => {
        const { data, error } = await supabase.rpc('search_profiles_for_affiliation', {
          query_text: trimmedQuery,
          max_results: MAX_RESULTS,
        });

        if (error) throw error;
        return (data ?? []) as InstructorCandidate[];
      });
      setResults(data);
    } catch (err) {
      console.error('Error fetching instructor candidates:', err);
    }
  }, [query]);

  useEffect(() => { void fetchCandidates(); }, [fetchCandidates]);

  return { results, refetch: fetchCandidates };
}
