/**
 * useMyCourses — union of courses the signed-in user is personally tied to.
 *
 * One hook, two perspectives, one cache entry:
 *   - Venue owner: every course hosted at their venue (`venue_id` match).
 *   - Artist / instructor: courses they authored (`created_by`) or teach
 *     (`instructor_id`).
 *
 * A user can be both (owns venue A, teaches at venue B) — the `.or()` filter
 * returns a deduped union so each course appears once. Row-level authority
 * (who can *approve* what) is decided by the consumer — see MyCourseRow.
 */

import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { cachedFetch, TTL } from '@/lib/cache';
import { Course, CourseSchedule } from '@/types/database';

export type MyCourse = Course & {
  course_schedules: Pick<CourseSchedule, 'date' | 'start_time' | 'end_time'>[];
};

type UseMyCoursesOptions = {
  userId?: string;
  venueId?: string;
};

const scheduleDates = (c: MyCourse): string[] =>
  c.course_schedules.map((s) => s.date).sort();

export function useMyCourses({ userId, venueId }: UseMyCoursesOptions) {
  const [items, setItems] = useState<MyCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const cacheKey = `my-courses:${userId ?? ''}:${venueId ?? ''}`;

  const fetchItems = useCallback(async () => {
    if (!userId && !venueId) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await cachedFetch(cacheKey, TTL.COURSES, async () => {
        // Build an OR filter so a user who is both owner and artist gets a
        // single deduped result set instead of two round-trips and a merge.
        const clauses: string[] = [];
        if (venueId) clauses.push(`venue_id.eq.${venueId}`);
        if (userId) {
          clauses.push(`created_by.eq.${userId}`);
          clauses.push(`instructor_id.eq.${userId}`);
        }

        const { data, error } = await supabase
          .from('courses')
          .select('*, course_schedules(date, start_time, end_time)')
          .or(clauses.join(','))
          .order('created_at', { ascending: false });

        if (error) throw error;
        return (data ?? []) as MyCourse[];
      });
      setItems(data);
    } catch (err) {
      console.error('Error fetching my courses:', err);
    } finally {
      setLoading(false);
    }
  }, [cacheKey, userId, venueId]);

  useFocusEffect(useCallback(() => { fetchItems(); }, [fetchItems]));

  const groups = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const upcoming: MyCourse[] = [];
    const past: MyCourse[] = [];
    const pending: MyCourse[] = [];

    for (const c of items) {
      // Pending courses float to their own bucket regardless of date — the
      // decision is the headline, not the calendar position.
      if (c.approval_status === 'pending_owner_review') {
        pending.push(c);
        continue;
      }
      const dates = scheduleDates(c);
      const last = dates[dates.length - 1];
      // No schedules yet → treat as upcoming (course is still being planned).
      if (!last || last >= today) upcoming.push(c);
      else past.push(c);
    }

    // Upcoming: earliest first. Past: most-recent first.
    upcoming.sort((a, b) =>
      (scheduleDates(a)[0] ?? '').localeCompare(scheduleDates(b)[0] ?? ''),
    );
    past.sort((a, b) => {
      const aLast = scheduleDates(a).pop() ?? '';
      const bLast = scheduleDates(b).pop() ?? '';
      return bLast.localeCompare(aLast);
    });

    return { upcoming, past, pending };
  }, [items]);

  return { ...groups, loading, refetch: fetchItems };
}
