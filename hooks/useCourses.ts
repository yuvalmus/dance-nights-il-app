import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Course, CourseSchedule } from '@/types/database';
import { CourseType } from '@/constants/config';
import { cachedFetch, invalidate, TTL } from '@/lib/cache';

export type CourseWithVenue = Course & {
  venues: { name: string; city: string } | null;
  course_schedules: Pick<CourseSchedule, 'day' | 'start_time' | 'end_time'>[];
};

export function useCourses(typeFilter: CourseType | null = null, searchQuery: string = '') {
  const [courses, setCourses] = useState<CourseWithVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = `courses:${typeFilter ?? 'all'}`;

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await cachedFetch(cacheKey, TTL.COURSES, async () => {
        let query = supabase
          .from('courses')
          .select('*, venues(name, city), course_schedules(day, start_time, end_time)')
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        if (typeFilter) query = query.eq('type', typeFilter);

        const { data, error: queryError } = await query;
        if (queryError) throw queryError;
        return (data ?? []) as CourseWithVenue[];
      });

      setCourses(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  }, [cacheKey]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses;

    const q = searchQuery.trim().toLowerCase();
    return courses.filter((c) =>
      c.title.toLowerCase().includes(q) ||
      c.instructor?.toLowerCase().includes(q) ||
      c.dance_style?.toLowerCase().includes(q) ||
      c.venues?.name?.toLowerCase().includes(q)
    );
  }, [courses, searchQuery]);

  const refetch = useCallback(() => {
    invalidate(cacheKey);
    return fetchCourses();
  }, [cacheKey, fetchCourses]);

  return { courses: filteredCourses, allCount: courses.length, loading, error, refetch };
}
