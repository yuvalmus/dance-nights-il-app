import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { cachedFetch, invalidate, TTL } from '@/lib/cache';

type FriendAtActivity = {
  id: string;
  display_name: string | null;
};

type ActivityTarget =
  | { eventId: string; courseId?: never }
  | { eventId?: never; courseId: string };

/**
 * Fetches accepted friends who marked "going" for a single event or course.
 * Uses the SECURITY DEFINER `get_friends_at_activity` RPC so the client
 * never scans registrations for other users.
 */
export function useFriendsAtActivity(target: ActivityTarget) {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendAtActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const cacheKey = target.eventId
    ? `friends_at:event:${target.eventId}`
    : `friends_at:course:${target.courseId}`;

  useEffect(() => {
    if (!user) {
      setFriends([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const data = await cachedFetch(cacheKey, TTL.FRIENDS_AT_ACTIVITY, async () => {
          const { data, error } = await supabase.rpc('get_friends_at_activity', {
            p_event_id: target.eventId ?? null,
            p_course_id: target.courseId ?? null,
          });
          if (error) throw error;
          return (data ?? []) as FriendAtActivity[];
        });
        if (!cancelled) setFriends(data);
      } catch (err) {
        console.error('useFriendsAtActivity:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user, cacheKey]);

  const refetch = () => {
    invalidate(cacheKey);
    setLoading(true);
    // Re-trigger the effect by... we can't directly. Instead, let's just
    // re-fetch inline.
    if (!user) return;
    (async () => {
      try {
        const { data, error } = await supabase.rpc('get_friends_at_activity', {
          p_event_id: target.eventId ?? null,
          p_course_id: target.courseId ?? null,
        });
        if (error) throw error;
        setFriends((data ?? []) as FriendAtActivity[]);
      } catch (err) {
        console.error('useFriendsAtActivity refetch:', err);
      } finally {
        setLoading(false);
      }
    })();
  };

  return { friends, loading, refetch };
}
