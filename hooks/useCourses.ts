import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Course, CourseSchedule } from '@/types/database';
import { CourseType } from '@/constants/config';
import { cachedFetch, invalidate, TTL } from '@/lib/cache';
import { CourseFilters, DEFAULT_COURSE_FILTERS } from '@/types/courseFilters';

export type CourseWithVenue = Course & {
  venues: { name: string; city: string } | null;
  course_schedules: Pick<CourseSchedule, 'day' | 'start_time' | 'end_time'>[];
};

const CACHE_KEY = 'courses:all';

export function useCourses(
  filters: CourseFilters = DEFAULT_COURSE_FILTERS,
  searchQuery: string = '',
) {
  const [allCourses, setAllCourses] = useState<CourseWithVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await cachedFetch(cacheKey, TTL.COURSES, async () => {
        let query = supabase
      }
      const data = await cachedFetch(CACHE_KEY, TTL.COURSES, async () => {
        const { data, error: queryError } = await supabase
          .from('courses')
          .select('*, venues(name, city), course_schedules(day, start_time, end_time)')
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        if (queryError) throw queryError;
        return (data ?? []) as CourseWithVenue[];
      });

      setAllCourses(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  // Courses for the selected type (before other filters)
  const coursesForType = useMemo(
    () => allCourses.filter((c) => c.type === filters.type),
    [allCourses, filters.type],
  );

  // Client-side filtering: level, instructor, fromDate, search
  const filteredCourses = useMemo(() => {
    let result = coursesForType;

    if (filters.levels.length > 0) {
      result = result.filter((c) =>
        c.level && filters.levels.includes(c.level),
      );
    }

    if (filters.instructors.length > 0) {
      result = result.filter((c) =>
        c.instructor && filters.instructors.includes(c.instructor),
      );
    }

    if (filters.fromDate) {
      const from = filters.fromDate;
      result = result.filter((c) => {
        if (c.dates.length === 0) return false;
        const firstDate = [...c.dates].sort()[0];
        return firstDate >= from;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((c) =>
        c.title.toLowerCase().includes(q) ||
        c.instructor?.toLowerCase().includes(q) ||
        c.dance_style?.toLowerCase().includes(q) ||
        c.venues?.name?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [coursesForType, filters.levels, filters.instructors, filters.fromDate, searchQuery]);

  // Instructors per type — available for any type, not just the applied one
  const getInstructorsForType = useCallback((type: CourseType): string[] => {
    const names = new Set<string>();
    for (const c of allCourses) {
      if (c.type === type && c.instructor) names.add(c.instructor);
    }
    return [...names].sort();
  }, [allCourses]);

  const refetch = useCallback(() => {
    invalidate(CACHE_KEY);
    return fetchCourses();
  }, [fetchCourses]);

  return {
    courses: filteredCourses,
    allCount: coursesForType.length,
    getInstructorsForType,
    loading,
    error,
    refetch,
  };
}
