/**
 * Notification → route translator.
 *
 * Centralised so a deep_link change in the DB payload or a route rename
 * needs one edit, not one per row component. The DB writes a `deep_link`
 * hint into `data` (see migration 023 / 025); the helpers here map that
 * onto expo-router shapes.
 */

import { Href } from 'expo-router';
import { NotificationFeedRow } from '@/types/database';

type Data = {
  deep_link?: string;
  event_id?: string;
  course_id?: string;
  venue_id?: string;
};

/** Returns an expo-router Href for the notification, or null when none applies. */
export function resolveNotificationRoute(n: NotificationFeedRow): Href | null {
  const data = (n.data ?? {}) as Data;
  const link = data.deep_link ?? '';

  // Event deep link → Dance tab with query params (matches the existing
  // event-link convention in app/(tabs)/index.tsx).
  if (link.startsWith('/?eventId=') || link.startsWith('/?eventid=')) {
    const params: Record<string, string> = {};
    link
      .replace(/^\/\?/, '')
      .split('&')
      .forEach((pair) => {
        const [k, v] = pair.split('=');
        if (k && v) params[k] = v;
      });
    return { pathname: '/', params } as Href;
  }

  if (link.startsWith('/course/')) {
    const courseId = data.course_id ?? link.slice('/course/'.length);
    if (courseId) {
      return { pathname: '/course/details', params: { courseId } } as Href;
    }
  }

  if (link === '/profile' || link.startsWith('/profile')) {
    return link as Href;
  }

  // Fall back to anything else the trigger wrote — expo-router accepts both
  // path strings and Href objects, so a manually-crafted absolute path works.
  if (link) return link as Href;

  return null;
}
