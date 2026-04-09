import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { cachedFetch, TTL } from '@/lib/cache';
import { isValidCourseId } from '@/lib/courseShare';
import { CourseWithVenue } from './useCourses';

/**
 * Fetches a single course by ID.
 * Tries the shared courses cache first, falls back to a dedicated per-course fetch.
 */
export function useCourseDetails(courseId: string | undefined) {
  const [course, setCourse] = useState<CourseWithVenue | null>(null);
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
          const { data, error: queryError } = await supabase
            .from('courses')
            .select('*, venues(name, city, address, location, slug, theme_colors), course_schedules(date, start_time, end_time, description)')
            .eq('id', courseId)
            .eq('is_published', true)
            .single();

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
  }, [courseId]);

  useEffect(() => { fetchCourse(); }, [fetchCourse]);

  return { course, loading, error };
}
