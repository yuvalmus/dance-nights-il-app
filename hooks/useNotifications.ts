/**
 * useNotifications — feed for the signed-in user.
 *
 * Keeps a focused surface: unread count + list + mark-read helpers. Push
 * delivery and per-type UI handling live with the screen that consumes this.
 */

import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { cachedFetch, TTL } from '@/lib/cache';
import { Notification } from '@/types/database';
import {
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/notificationService';

const RECENT_LIMIT = 50;

export function useNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const cacheKey = user ? `notifications:${user.id}` : '';

  const fetchItems = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await cachedFetch(cacheKey, TTL.NOTIFICATIONS, async () => {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(RECENT_LIMIT);

        if (error) throw error;
        return (data ?? []) as Notification[];
      });
      setItems(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user, cacheKey]);

  useFocusEffect(useCallback(() => { fetchItems(); }, [fetchItems]));

  const unreadCount = useMemo(
    () => items.filter((n) => n.read_at === null).length,
    [items],
  );

  const markOneRead = useCallback(async (id: string) => {
    await markNotificationRead(id);
    await fetchItems();
  }, [fetchItems]);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    await markAllNotificationsRead(user.id);
    await fetchItems();
  }, [user, fetchItems]);

  return {
    notifications: items,
    unreadCount,
    loading,
    markRead: markOneRead,
    markAllRead,
    refetch: fetchItems,
  };
}
