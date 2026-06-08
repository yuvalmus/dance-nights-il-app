/**
 * Notification copy + presentation helpers.
 *
 * The SQL layer owns the final Hebrew strings (see
 * supabase/migrations/023_notifications_v2.sql `build_friends_going_body`).
 * This module owns *display-only* helpers the UI needs that don't belong on
 * the server — relative-time formatting and per-type icon lookup.
 */

import { NotificationType } from '@/types/database';

const ICONS: Record<NotificationType, string> = {
  instructor_left_venue:     'person-remove-outline',
  instructor_invite:         'mail-outline',
  course_pending_approval:   'clipboard-outline',
  course_approved:           'checkmark-circle-outline',
  course_rejected:           'close-circle-outline',
  friend_request:            'person-add-outline',
  friend_accepted:           'checkmark-circle-outline',
  friend_going_event:        'people-outline',
  friend_going_course:       'people-outline',
  friends_going:             'people-outline',
  event_date_changed:        'calendar-outline',
  event_cancelled:           'close-circle-outline',
  event_reminder:            'alarm-outline',
  course_starting_this_week: 'calendar-outline',
  registration_spike:        'trending-up-outline',
  spots_low:                 'hourglass-outline',
  favorite_venue_event:      'heart-outline',
  favorite_artist_course:    'heart-outline',
};

export function iconForNotificationType(type: NotificationType): string {
  return ICONS[type] ?? 'notifications-outline';
}

/** "לפני 5 ד'", "לפני 2 שעות", "לפני 3 ימים". */
export function formatRelativeHe(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'זה עתה';
  if (mins < 60) return `לפני ${mins} ד'`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `לפני ${hours} שעות`;
  const days = Math.floor(hours / 24);
  return `לפני ${days} ימים`;
}
