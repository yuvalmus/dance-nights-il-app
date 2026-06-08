/**
 * Notifications mutation helpers.
 *
 * Clients cannot INSERT — rows are owned by the DB triggers. The surface
 * here covers the user-driven mutations the inbox screen needs:
 *
 *   * mark-read (single + all),
 *   * inline actions for actionable types (accept/decline friend request,
 *     approve/reject pending course, accept/decline instructor invite).
 *
 * Each action invalidates the relevant caches so other screens (the friends
 * list, the venue approval inbox) refresh next time they're focused.
 */

import { supabase } from '@/lib/supabase';
import { invalidate, invalidateByPrefix } from '@/lib/cache';
import { approveCourse, rejectCourse } from '@/lib/courseApprovalService';

function clearNotificationCaches() {
  invalidateByPrefix('notifications:');
  invalidateByPrefix('notifications-unread:');
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .is('read_at', null);

  if (error) throw error;
  clearNotificationCaches();
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) throw error;
  clearNotificationCaches();
}

// --- Inline actions -------------------------------------------------------
//
// Each action follows the same shape: call the existing SECURITY DEFINER RPC,
// mark the originating notification read (so the row visually settles), and
// invalidate sibling caches so the related screen renders the new state.

export async function acceptFriendRequest(requesterId: string, notificationId: string) {
  const { error } = await supabase.rpc('accept_friend', { requester_id: requesterId });
  if (error) throw error;
  invalidate('friend-count');
  invalidateByPrefix('friends:');
  invalidateByPrefix('pending-requests:');
  await markNotificationRead(notificationId);
}

export async function declineFriendRequest(requesterId: string, notificationId: string) {
  const { error } = await supabase.rpc('remove_friendship_record', { target_id: requesterId });
  if (error) throw error;
  invalidateByPrefix('pending-requests:');
  // The trigger deletes the notification on decline. Mark-read is a no-op then.
  try {
    await markNotificationRead(notificationId);
  } catch {
    /* row already gone */
  }
}

export async function approvePendingCourse(courseId: string, notificationId: string) {
  await approveCourse(courseId);
  try {
    await markNotificationRead(notificationId);
  } catch {
    /* trigger removed the row */
  }
}

export async function rejectPendingCourse(courseId: string, notificationId: string) {
  await rejectCourse(courseId);
  try {
    await markNotificationRead(notificationId);
  } catch {
    /* trigger removed the row */
  }
}

export async function acceptInstructorInvite(affiliationId: string, notificationId: string) {
  const { error } = await supabase
    .from('venue_affiliations')
    .update({ status: 'active' })
    .eq('id', affiliationId);
  if (error) throw error;
  invalidateByPrefix('affiliations:');
  try {
    await markNotificationRead(notificationId);
  } catch {
    /* row removed by trigger */
  }
}

export async function declineInstructorInvite(affiliationId: string, notificationId: string) {
  const { error } = await supabase
    .from('venue_affiliations')
    .update({ status: 'revoked' })
    .eq('id', affiliationId);
  if (error) throw error;
  invalidateByPrefix('affiliations:');
  try {
    await markNotificationRead(notificationId);
  } catch {
    /* row removed by trigger */
  }
}
