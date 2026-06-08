/**
 * useNotifications — paginated feed for the signed-in user.
 *
 * Hits the `get_notification_feed` RPC with a (sort_at, id) cursor so the
 * inbox scrolls forever without a fixed page size. Mark-read helpers wrap
 * the mutation layer and refetch the first page so the badge stays accurate.
 *
 * The hook is screen-scoped: it refetches on focus rather than subscribing
 * to Realtime, matching the v1 "refetch on screen focus" stance from the
 * notifications redesign plan.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { NotificationFeedRow } from '@/types/database';
import {
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/notificationService';

const PAGE_LIMIT = 20;

type FeedCursor = { sort_at: string; id: string } | null;

export function useNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<NotificationFeedRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  // Cursor for the next page. Tracked in a ref because successive
  // `loadMore` calls during a fast scroll must not race against each other.
  const cursorRef = useRef<FeedCursor>(null);

  const fetchPage = useCallback(
    async (cursor: FeedCursor): Promise<NotificationFeedRow[]> => {
      const { data, error } = await supabase.rpc('get_notification_feed', {
        p_cursor_sort_at: cursor?.sort_at ?? null,
        p_cursor_id: cursor?.id ?? null,
        p_limit: PAGE_LIMIT,
      });
      if (error) throw error;
      return (data ?? []) as NotificationFeedRow[];
    },
    [],
  );

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      setUnreadCount(0);
      setHasMore(false);
      setLoading(false);
      cursorRef.current = null;
      return;
    }
    try {
      setLoading(true);
      const rows = await fetchPage(null);
      setItems(rows);
      setUnreadCount(rows[0]?.unread_count ?? 0);
      setHasMore(rows[0]?.has_more ?? false);
      cursorRef.current = rows.length
        ? { sort_at: rows[rows.length - 1].sort_at, id: rows[rows.length - 1].id }
        : null;
    } catch (err) {
      console.error('useNotifications refresh:', err);
    } finally {
      setLoading(false);
    }
  }, [user, fetchPage]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const loadMore = useCallback(async () => {
    if (!user || loadingMore || !hasMore) return;
    const cursor = cursorRef.current;
    if (!cursor) return;
    try {
      setLoadingMore(true);
      const rows = await fetchPage(cursor);
      if (rows.length === 0) {
        setHasMore(false);
        return;
      }
      setItems((prev) => [...prev, ...rows]);
      setUnreadCount(rows[0]?.unread_count ?? unreadCount);
      setHasMore(rows[0]?.has_more ?? false);
      cursorRef.current = {
        sort_at: rows[rows.length - 1].sort_at,
        id: rows[rows.length - 1].id,
      };
    } catch (err) {
      console.error('useNotifications loadMore:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [user, loadingMore, hasMore, fetchPage, unreadCount]);

  // Optimistic mark-read: flip locally first so the row state is instant,
  // then reconcile against the server with a full refresh in the background.
  const markRead = useCallback(
    async (id: string) => {
      const target = items.find((n) => n.id === id);
      if (!target || target.read_at !== null) return;
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await markNotificationRead(id);
      } catch (err) {
        console.error('useNotifications markRead:', err);
        refresh();
      }
    },
    [items, refresh],
  );

  const markAllRead = useCallback(async () => {
    if (!user) return;
    setItems((prev) =>
      prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })),
    );
    setUnreadCount(0);
    try {
      await markAllNotificationsRead(user.id);
    } catch (err) {
      console.error('useNotifications markAllRead:', err);
      refresh();
    }
  }, [user, refresh]);

  // Surface unread/loading separately so callers don't repeatedly derive them.
  const value = useMemo(
    () => ({
      notifications: items,
      unreadCount,
      loading,
      loadingMore,
      hasMore,
      markRead,
      markAllRead,
      loadMore,
      refetch: refresh,
    }),
    [items, unreadCount, loading, loadingMore, hasMore, markRead, markAllRead, loadMore, refresh],
  );

  return value;
}
