import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { cachedFetch, invalidate, TTL } from '@/lib/cache';

export type SocialState = 'friends' | 'momentum' | 'early';

export type ActivityFriend = {
  id: string;
  display_name: string | null;
};

type ActivityTarget =
  | { eventId: string; courseId?: never }
  | { eventId?: never; courseId: string };

type SocialPayload = {
  totalGoing: number;
  viewerGoing: boolean;
  friends: ActivityFriend[];
};

const EMPTY: SocialPayload = { totalGoing: 0, viewerGoing: false, friends: [] };

/**
 * Everything the social block needs for one event or course, in a single
 * round-trip via the `get_activity_social` RPC: the going count, the
 * viewer's own "going" flag, and the accepted friends who are going.
 *
 * `toggle` flips the viewer's registration (INSERT/DELETE) with optimistic
 * local state. `state` is the UX state the social block renders against:
 *   - `friends`  — at least one friend is going (social proof).
 *   - `momentum` — no friends, but other people are going.
 *   - `early`    — no signal yet; lean on the early-adopter framing.
 *
 * The state is derived from *other* people only (the viewer's own toggle is
 * excluded), so joining never makes the block flip between states.
 */
export function useActivitySocial(target: ActivityTarget) {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<SocialPayload>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const activityId = target.eventId || target.courseId;
  const cacheKey = target.eventId
    ? `activity_social:event:${target.eventId}`
    : `activity_social:course:${target.courseId}`;

  useEffect(() => {
    // Anonymous viewers can't resolve friends; the RPC is authenticated-only.
    // The block still renders — it falls through to the `early` framing.
    // A missing id (invalid route param) is treated the same — no fetch.
    if (!user || !activityId) {
      setData(EMPTY);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const payload = await cachedFetch(cacheKey, TTL.ACTIVITY_SOCIAL, async () => {
          const { data, error } = await supabase.rpc('get_activity_social', {
            p_event_id: target.eventId ?? null,
            p_course_id: target.courseId ?? null,
          });
          if (error) throw error;
          const row = (data ?? [])[0];
          return {
            totalGoing: row?.total_going ?? 0,
            viewerGoing: row?.viewer_going ?? false,
            friends: (row?.friends ?? []) as ActivityFriend[],
          };
        });
        if (!cancelled) setData(payload);
      } catch (err) {
        console.error('useActivitySocial fetch:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user, activityId, cacheKey]);

  const toggle = useCallback(async () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    if (toggling) return;

    const prev = data;
    const nextGoing = !prev.viewerGoing;
    setData({
      ...prev,
      viewerGoing: nextGoing,
      totalGoing: prev.totalGoing + (nextGoing ? 1 : -1),
    });
    setToggling(true);

    try {
      const col = target.eventId ? 'event_id' : 'course_id';
      const val = target.eventId ?? target.courseId;
      if (prev.viewerGoing) {
        const { error } = await supabase
          .from('registrations')
          .delete()
          .eq('user_id', user.id)
          .eq(col, val);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('registrations')
          .insert({
            user_id: user.id,
            event_id: target.eventId ?? null,
            course_id: target.courseId ?? null,
          });
        if (error) throw error;
      }
      // Drop the cache so a re-open reflects the new count.
      invalidate(cacheKey);
    } catch (err) {
      console.error('useActivitySocial toggle:', err);
      setData(prev); // rollback
    } finally {
      setToggling(false);
    }
  }, [user, data, toggling, target, cacheKey, router]);

  const state: SocialState = useMemo(() => {
    if (data.friends.length > 0) return 'friends';
    const others = data.totalGoing - (data.viewerGoing ? 1 : 0);
    return others > 0 ? 'momentum' : 'early';
  }, [data]);

  return {
    /** Whether a viewer is signed in — the social block is hidden when not. */
    authenticated: !!user,
    friends: data.friends,
    totalGoing: data.totalGoing,
    viewerGoing: data.viewerGoing,
    state,
    loading,
    toggling,
    toggle,
  };
}
