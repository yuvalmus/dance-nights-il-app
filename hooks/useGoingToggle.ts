import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { cachedFetch, invalidate, invalidateByPrefix, TTL } from '@/lib/cache';

type GoingTarget =
  | { eventId: string; courseId?: never }
  | { eventId?: never; courseId: string };

/**
 * Manages the binary "going" toggle for a single event or course.
 * - Reads own registration row (RLS-scoped to auth.uid()).
 * - INSERT to mark going, DELETE to unmark.
 * - Optimistic local state; rolls back on error.
 * - Auth gate: redirects to login if no session.
 */
export function useGoingToggle(target: GoingTarget) {
  const { user } = useAuth();
  const router = useRouter();
  const [isGoing, setIsGoing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const activityKey = target.eventId
    ? `going:event:${target.eventId}`
    : `going:course:${target.courseId}`;

  // Check if user has a registration for this activity.
  useEffect(() => {
    if (!user) {
      setIsGoing(false);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const going = await cachedFetch(activityKey, TTL.GOING, async () => {
          const col = target.eventId ? 'event_id' : 'course_id';
          const val = target.eventId ?? target.courseId;
          const { data, error } = await supabase
            .from('registrations')
            .select('id')
            .eq('user_id', user.id)
            .eq(col, val)
            .maybeSingle();
          if (error) throw error;
          return !!data;
        });
        if (!cancelled) setIsGoing(going);
      } catch (err) {
        console.error('useGoingToggle fetch:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user, activityKey]);

  const toggle = useCallback(async () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    if (toggling) return;

    const prev = isGoing;
    setIsGoing(!prev);
    setToggling(true);

    try {
      if (prev) {
        // Unmark — delete own registration row.
        const col = target.eventId ? 'event_id' : 'course_id';
        const val = target.eventId ?? target.courseId;
        const { error } = await supabase
          .from('registrations')
          .delete()
          .eq('user_id', user.id)
          .eq(col, val);
        if (error) throw error;
      } else {
        // Mark going — insert registration row.
        const { error } = await supabase
          .from('registrations')
          .insert({
            user_id: user.id,
            event_id: target.eventId ?? null,
            course_id: target.courseId ?? null,
          });
        if (error) throw error;
      }

      // Invalidate caches so friends strip refreshes on next focus.
      invalidate(activityKey);
      invalidateByPrefix('friends_at:');
    } catch (err) {
      console.error('useGoingToggle toggle:', err);
      setIsGoing(prev); // rollback
    } finally {
      setToggling(false);
    }
  }, [user, isGoing, toggling, target, activityKey, router]);

  return { isGoing, loading, toggling, toggle };
}
