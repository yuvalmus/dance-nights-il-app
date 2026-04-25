/**
 * Course mutation layer. Mirrors eventService — handles poster upload,
 * row insert, and schedule rows in one public call. The INSERT trigger
 * on `courses` handles approval_status; the app never sets it directly.
 */

import { supabase } from '@/lib/supabase';
import { invalidateByPrefix } from '@/lib/cache';
import { CourseFormValues } from '@/components/courses/CourseForm';

type CreateCourseParams = {
  values: CourseFormValues;
  userId: string;
};

async function uploadPoster(uri: string, userId: string): Promise<string> {
  const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `courses/${userId}/${Date.now()}.${ext}`;

  const formData = new FormData();
  formData.append('file', {
    uri,
    name: `poster.${ext}`,
    type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
  } as any);

  const { error } = await supabase.storage
    .from('posters')
    .upload(path, formData, { contentType: 'multipart/form-data' });

  if (error) throw error;
  const { data } = supabase.storage.from('posters').getPublicUrl(path);
  return data.publicUrl;
}

async function insertSchedules(
  courseId: string,
  schedules: CourseFormValues['schedules'],
): Promise<void> {
  if (schedules.length === 0) return;
  const rows = schedules.map((s) => ({
    course_id: courseId,
    date: s.date,
    start_time: s.start_time,
    end_time: s.end_time,
    description: s.description || null,
  }));
  const { error } = await supabase.from('course_schedules').insert(rows);
  if (error) throw error;
}

function buildCourseRow(
  values: CourseFormValues,
  posterUrl: string | null,
  userId: string,
) {
  return {
    title: values.title,
    description: values.description || null,
    type: values.type,
    dance_style: values.dance_style || null,
    level: values.level || null,
    instructor: values.instructor.trim() || null,
    instructor_id: values.instructor_id || null,
    venue_id: values.venue?.id || null,
    price: values.price ? parseInt(values.price, 10) : null,
    spots_total: values.spots_total ? parseInt(values.spots_total, 10) : null,
    registration_url: values.registration_url.trim() || null,
    is_published: values.is_published,
    announcements: values.announcements,
    learning_outcomes: values.learning_outcomes,
    poster_url: posterUrl,
    created_by: userId,
  };
}

function invalidateCourseCaches() {
  // Course list, my-courses surface, and owner approval inbox all depend
  // on the set of courses — blow them away so the next focus fetches fresh.
  invalidateByPrefix('courses:');
  invalidateByPrefix('my-courses:');
  invalidateByPrefix('course-approval:');
}

export async function createCourse({
  values,
  userId,
}: CreateCourseParams): Promise<void> {
  let posterUrl: string | null = null;
  if (values.posterUri && values.posterChanged) {
    posterUrl = await uploadPoster(values.posterUri, userId);
  }

  const { data: course, error } = await supabase
    .from('courses')
    .insert(buildCourseRow(values, posterUrl, userId))
    .select()
    .single();

  if (error) throw error;

  await insertSchedules(course.id, values.schedules);

  invalidateCourseCaches();
}
