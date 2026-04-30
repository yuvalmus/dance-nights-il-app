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
import {
  deleteCourse as deleteCourseCall,
  setCoursePublish as setCoursePublishCall,
} from '@/lib/courseService';

export type MyCourse = Course & {
  course_schedules: Pick<CourseSchedule, 'date' | 'start_time' | 'end_time'>[];
  /** Display name of the creator — only populated for rows where the
   * viewer is not the creator (typically: venue owner viewing an artist's
   * course at their venue). */
  creator_display_name?: string | null;
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
      // Don't flip `loading` back to true on refetches. The initial
      // useState(true) covers the first load; focus refetches and
      // post-mutation refetches must be silent so MyCoursesSection
      // (which returns null while loading) doesn't unmount and force
      // the whole profile page to re-layout.
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
        const courses = (data ?? []) as MyCourse[];

        // Resolve creator names for rows not authored by the current user
        // (typically: venue owner seeing an artist's course at their venue).
        // Two-step fetch to keep RLS happy — see useCourseApprovalQueue.
        const otherCreatorIds = Array.from(
          new Set(
            courses
              .filter((c) => c.created_by && c.created_by !== userId)
              .map((c) => c.created_by!)
              .filter(Boolean),
          ),
        );

        if (otherCreatorIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name')
            .in('id', otherCreatorIds);
          const byId = new Map(
            (profiles ?? []).map((p) => [p.id, p.display_name as string | null]),
          );
          for (const c of courses) {
            if (c.created_by && c.created_by !== userId) {
              c.creator_display_name = byId.get(c.created_by) ?? null;
            }
          }
        }

        return courses;
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
      // Pending + rejected float to their own bucket regardless of date —
      // neither is publicly visible yet, so grouping them with "upcoming"
      // would misrepresent their state. The decision/non-decision is the
      // headline, not the calendar position.
      if (
        c.approval_status === 'pending_owner_review' ||
        c.approval_status === 'rejected'
      ) {
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

  // Local-only state mutations after a successful DB write. Avoid calling
  // fetchItems here — it flips `loading` back on, which unmounts the whole
  // profile section and causes a visible re-render of unrelated content.
  // The cache is already invalidated inside courseService, so the next
  // useFocusEffect on profile entry will pick up canonical state.
  const togglePublish = useCallback(
    async (courseId: string, currentlyPublished: boolean) => {
      const next = !currentlyPublished;
      try {
        await setCoursePublishCall(courseId, next);
        setItems((prev) =>
          prev.map((c) => (c.id === courseId ? { ...c, is_published: next } : c)),
        );
      } catch (err) {
        console.error('togglePublish failed:', err);
        await fetchItems(); // rollback to truth on error
      }
    },
    [fetchItems],
  );

  const removeCourse = useCallback(
    async (courseId: string) => {
      try {
        await deleteCourseCall(courseId);
        setItems((prev) => prev.filter((c) => c.id !== courseId));
      } catch (err) {
        console.error('deleteCourse failed:', err);
        await fetchItems();
      }
    },
    [fetchItems],
  );

  return {
    ...groups,
    loading,
    refetch: fetchItems,
    togglePublish,
    deleteCourse: removeCourse,
  };
}
