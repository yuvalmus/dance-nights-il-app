import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { cachedFetch, invalidate, TTL } from '@/lib/cache';

export type PendingRequest = {
  id: string;
  display_name: string | null;
  is_artist: boolean;
  requested_at: string;
};

const CACHE_KEY = 'pending-friend-requests';

export function usePendingRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) {
      setRequests([]);
      setLoading(false);
      return;
    }

    try {
      const data = await cachedFetch(CACHE_KEY, TTL.NOTIFICATIONS, async () => {
        const { data, error } = await supabase.rpc('get_pending_friend_requests');
        if (error) throw error;
        return (data ?? []) as PendingRequest[];
      });
      setRequests(data);
    } catch (err) {
      console.error('usePendingRequests:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { fetch(); }, [fetch]));

  const refetch = useCallback(() => {
    invalidate(CACHE_KEY);
    return fetch();
  }, [fetch]);

  return { requests, loading, refetch };
}
