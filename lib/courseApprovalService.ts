/**
 * Course-approval mutation layer.
 *
 * All approval transitions flow through the `set_course_approval` RPC —
 * it is the only writer the DB trusts for approval_* columns. Keeps the
 * authority model simple: RLS handles reads, RPC handles approval writes,
 * direct UPDATEs handle creator content edits.
 */

import { supabase } from '@/lib/supabase';
import { CourseApprovalStatus } from '@/types/database';
import { invalidateByPrefix, invalidate } from '@/lib/cache';

type ApprovalStatus = Exclude<CourseApprovalStatus, 'not_required'>;

export async function setCourseApproval(
  courseId: string,
  status: ApprovalStatus,
): Promise<void> {
  const { error } = await supabase.rpc('set_course_approval', {
    target_course_id: courseId,
    new_status: status,
  });

  if (error) throw error;

  // Refresh any cached course data — the public listing, per-course detail,
  // and the owner approval inbox all depend on approval_status.
  invalidateByPrefix('courses:');
  invalidateByPrefix('course-approval:');
  invalidate(`course:${courseId}`);
}

export const approveCourse = (id: string) => setCourseApproval(id, 'approved');
export const rejectCourse = (id: string) => setCourseApproval(id, 'rejected');
export const reopenCourse = (id: string) => setCourseApproval(id, 'pending_owner_review');
