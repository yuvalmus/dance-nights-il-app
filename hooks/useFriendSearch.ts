import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { cachedFetch, TTL } from '@/lib/cache';

export type FriendCandidate = {
  id: string;
  display_name: string | null;
  is_artist: boolean;
  pending: boolean;
  venue_name: string | null;
  venue_logo_url: string | null;
};

const MAX_RESULTS = 7;

export function useFriendSearch(query: string) {
  const [results, setResults] = useState<FriendCandidate[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCandidates = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const cacheKey = `friend-search:${trimmed.toLowerCase()}`;
      const data = await cachedFetch(cacheKey, TTL.FRIENDS, async () => {
        const { data, error } = await supabase.rpc('search_profiles_for_friends', {
          query_text: trimmed,
          max_results: MAX_RESULTS,
        });
        if (error) throw error;
        return (data ?? []) as FriendCandidate[];
      });
      setResults(data);
    } catch (err) {
      console.error('useFriendSearch:', err);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { void fetchCandidates(); }, [fetchCandidates]);

  return { results, loading, refetch: fetchCandidates };
}
