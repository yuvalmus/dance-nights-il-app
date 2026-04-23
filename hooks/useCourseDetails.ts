import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { cachedFetch, TTL } from '@/lib/cache';
import { isValidCourseId } from '@/lib/courseShare';
import { CourseWithVenue } from './useCourses';

type UseCourseDetailsOptions = {
  /**
   * Include unpublished courses — used by the venue owner's approval flow
   * where the course hasn't been published yet. RLS still gates visibility,
   * so random callers can't bypass publish state via this flag.
   */
  includeUnpublished?: boolean;
};

/**
 * Fetches a single course by ID.
 * Tries the shared courses cache first, falls back to a dedicated per-course fetch.
 */
export function useCourseDetails(
  courseId: string | undefined,
  options?: UseCourseDetailsOptions,
) {
  const [course, setCourse] = useState<CourseWithVenue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const includeUnpublished = options?.includeUnpublished ?? false;

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

      // Separate cache key so the admin (owner-approval) view doesn't
      // pollute the public cache — same id, different filter semantics.
      const cacheKey = includeUnpublished
        ? `course:${courseId}:admin`
        : `course:${courseId}`;

      const data = await cachedFetch(
        cacheKey,
        TTL.COURSES,
        async () => {
          let query = supabase
            .from('courses')
            .select('*, venues(name, city, address, location, slug, theme_colors), course_schedules(date, start_time, end_time, description)')
            .eq('id', courseId);

          if (!includeUnpublished) query = query.eq('is_published', true);

          const { data, error: queryError } = await query.single();

          if (queryError) throw queryError;
          return data as CourseWithVenue;
        },
      );

      setCourse(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching course details:', err);
    } finally {
      setLoading(false);
    }
  }, [courseId, includeUnpublished]);

  useEffect(() => { fetchCourse(); }, [fetchCourse]);

  return { course, loading, error };
}
