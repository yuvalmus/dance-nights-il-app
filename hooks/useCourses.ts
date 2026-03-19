import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Course } from '@/types/database';

type CourseType = 'course' | 'bootcamp' | 'festival' | null;

export function useCourses(typeFilter: CourseType = null) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('start_date', { ascending: true });

      if (typeFilter) {
        query = query.eq('type', typeFilter);
      }

      const { data, error: queryError } = await query;
      if (queryError) throw queryError;
      setCourses(data ?? []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return { courses, loading, error, refetch: fetchCourses };
}
