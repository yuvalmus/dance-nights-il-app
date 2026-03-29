import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Course } from '@/types/database';
import { CourseType } from '@/constants/config';
import { cachedFetch, invalidate, TTL } from '@/lib/cache';

export function useCourses(typeFilter: CourseType | null = null) {
  const [courses, setCourses] = useState<Course[]>([]);
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
          .select('*')
          .eq('is_published', true)
          .order('start_date', { ascending: true });

        if (typeFilter) query = query.eq('type', typeFilter);

        const { data, error: queryError } = await query;
        if (queryError) throw queryError;
        return data ?? [];
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

  const refetch = useCallback(() => {
    invalidate(cacheKey);
    return fetchCourses();
  }, [cacheKey, fetchCourses]);

  return { courses, loading, error, refetch };
}
