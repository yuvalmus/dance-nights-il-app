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

type UpdateCourseParams = {
  values: CourseFormValues;
  courseId: string;
  userId: string;
  originalPosterUrl: string | null;
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

async function deletePoster(posterUrl: string): Promise<void> {
  const path = posterUrl.split('/posters/')[1];
  if (path) {
    await supabase.storage.from('posters').remove([path]);
  }
}

async function replaceSchedules(
  courseId: string,
  schedules: CourseFormValues['schedules'],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from('course_schedules')
    .delete()
    .eq('course_id', courseId);
  if (deleteError) throw deleteError;
  await insertSchedules(courseId, schedules);
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
  // The singular `course:` prefix targets per-course detail caches; the
  // plural `courses:` prefix targets the public list — they're disjoint
  // (the colon at position 6 separates them).
  invalidateByPrefix('course:');
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

export async function updateCourse({
  values,
  courseId,
  userId,
  originalPosterUrl,
}: UpdateCourseParams): Promise<void> {
  let posterUrl: string | null = values.posterUri;

  if (values.posterChanged) {
    if (originalPosterUrl) {
      await deletePoster(originalPosterUrl);
    }
    posterUrl = values.posterUri
      ? await uploadPoster(values.posterUri, userId)
      : null;
  }

  // Strip created_by — it's set on insert and must never be rewritten.
  const { created_by: _ignored, ...row } = buildCourseRow(values, posterUrl, userId);
  const { error } = await supabase
    .from('courses')
    .update(row)
    .eq('id', courseId);

  if (error) throw error;

  await replaceSchedules(courseId, values.schedules);

  invalidateCourseCaches();
}

export async function deleteCourse(courseId: string): Promise<void> {
  // course_schedules has ON DELETE CASCADE in the schema, but we delete
  // explicitly to keep parity with eventService and avoid surprises if
  // the FK rule ever changes.
  await supabase.from('course_schedules').delete().eq('course_id', courseId);

  const { error } = await supabase.from('courses').delete().eq('id', courseId);
  if (error) throw error;

  invalidateCourseCaches();
}

export async function setCoursePublish(
  courseId: string,
  isPublished: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('courses')
    .update({ is_published: isPublished })
    .eq('id', courseId);
  if (error) throw error;

  invalidateCourseCaches();
}
