import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { cachedFetch, invalidate, TTL } from '@/lib/cache';
import { FriendProfile } from '@/types/database';

const CACHE_KEY = 'my-friends';

export function useMyFriends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) {
      setFriends([]);
      setLoading(false);
      return;
    }

    try {
      const data = await cachedFetch(CACHE_KEY, TTL.FRIENDS, async () => {
        const { data, error } = await supabase.rpc('get_my_friends');
        if (error) throw error;
        return (data ?? []) as FriendProfile[];
      });
      setFriends(data);
    } catch (err) {
      console.error('useMyFriends:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { fetch(); }, [fetch]));

  const refetch = useCallback(() => {
    invalidate(CACHE_KEY);
    return fetch();
  }, [fetch]);

  return { friends, loading, refetch };
}
