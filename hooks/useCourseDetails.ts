import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { cachedFetch, TTL } from '@/lib/cache';
import { isValidCourseId } from '@/lib/courseShare';
import { CourseWithVenue } from './useCourses';

export type CourseDetails = CourseWithVenue & {
  venues:
    | (CourseWithVenue['venues'] & { owner_id: string | null })
    | null;
  creator_display_name: string | null;
};

/**
 * Fetches a single course by ID, plus the venue owner_id and creator
 * display_name so consumers can derive permission state (creator vs.
 * venue-owner-viewing-someone-else's-course) without extra round-trips.
 *
 * Deliberately does NOT filter by `is_published` — RLS is the source of
 * truth for who can see what (owners / creators / instructors can read
 * unpublished rows, everyone else only published ones), so re-imposing the
 * filter client-side just blocks legitimate self-access (e.g. an artist
 * opening their own draft via a share link).
 */
export function useCourseDetails(courseId: string | undefined) {
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourse = useCallback(async () => {
    if (!courseId) return;

    if (!isValidCourseId(courseId)) {
      setError('invalid_id');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await cachedFetch(
        `course:${courseId}`,
        TTL.COURSES,
        async () => {
          const { data: row, error: queryError } = await supabase
            .from('courses')
            .select('*, venues(name, city, address, location, slug, theme_colors, owner_id), course_schedules(date, start_time, end_time, description)')
            .eq('id', courseId)
            .single();

          if (queryError) throw queryError;

          // Creator name is fetched separately — joining `profiles` directly
          // would fail under RLS for viewers without read access to the
          // creator's row. We tolerate a null result and keep the call
          // best-effort so the page still renders if the lookup misses.
          let creatorDisplayName: string | null = null;
          if (row.created_by) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('id', row.created_by)
              .maybeSingle();
            creatorDisplayName = profile?.display_name ?? null;
          }

          return {
            ...(row as CourseWithVenue),
            venues: row.venues
              ? { ...row.venues, owner_id: row.venues.owner_id ?? null }
              : null,
            creator_display_name: creatorDisplayName,
          } as CourseDetails;
        },
      );

      setCourse(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching course details:', err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { fetchCourse(); }, [fetchCourse]);

  /**
   * In-place patch for the loaded course. Use this after a mutation that
   * touches a single field (publish toggle, etc.) to avoid a full refetch
   * + loading flip — which makes the screen flash and unmount unrelated
   * subtrees while we wait for the network round-trip.
   */
  const mutate = useCallback(
    (patch: Partial<CourseDetails>) => {
      setCourse((prev) => (prev ? { ...prev, ...patch } : prev));
    },
    [],
  );

  return { course, loading, error, refetch: fetchCourse, mutate };
}
