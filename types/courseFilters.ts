import { CourseType } from '@/constants/config';

export type CourseFilters = {
  type: CourseType;
  levels: string[];
  instructors: string[];
  fromDate: string | null; // ISO date string YYYY-MM-DD
};

export const DEFAULT_COURSE_FILTERS: CourseFilters = {
  type: 'course',
  levels: [],
  instructors: [],
  fromDate: null,
};
