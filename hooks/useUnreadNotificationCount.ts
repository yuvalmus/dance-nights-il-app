/**
 * useUnreadNotificationCount — cheap probe for the Dance-tab floating button.
 *
 * The badge needs only a single integer, so we hit a dedicated RPC rather
 * than the full feed. Refetches on screen focus; the inbox screen invalidates
 * the cached count when the user opens it.
 */

import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { cachedFetch, invalidate, TTL } from '@/lib/cache';

export function useUnreadNotificationCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const cacheKey = user ? `notifications-unread:${user.id}` : '';

  const refetch = useCallback(async () => {
    if (!user) {
      setCount(0);
      return;
    }
    try {
      const value = await cachedFetch(cacheKey, TTL.NOTIFICATIONS, async () => {
        const { data, error } = await supabase.rpc('get_notification_unread_count');
        if (error) throw error;
        return (data ?? 0) as number;
      });
      setCount(value);
    } catch (err) {
      console.error('useUnreadNotificationCount:', err);
    }
  }, [user, cacheKey]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  // Allow the inbox screen to nudge the badge after mark-all-read without
  // waiting for the next focus event.
  const reset = useCallback(() => {
    invalidate(cacheKey);
    setCount(0);
  }, [cacheKey]);

  return { count, refetch, reset };
}
