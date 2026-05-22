import { Share } from 'react-native';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function isValidEventId(id: string): boolean {
  return UUID_REGEX.test(id);
}

/** A `YYYY-MM-DD` date key as used by the tonight feed and the cache. */
export function isValidDateKey(date: string): boolean {
  return DATE_KEY_REGEX.test(date);
}

/**
 * Deep link to a single event. Events have no route of their own, so the link
 * lands on the tonight tab (root path) carrying the event id and its date —
 * the tab reads them, jumps to that date, centres the pin and expands the card.
 *
 * The link is only a hint: the tonight tab still loads events through the
 * RLS-guarded RPC, so a link can never surface an event the viewer isn't
 * allowed to see (unpublished, past, or otherwise hidden).
 */
export function buildEventDeepLink(eventId: string, date: string): string {
  return `bailando:///?eventId=${eventId}&date=${date}`;
}

/**
 * Shares an invitation to a dance event. When the id and date are well-formed
 * the message carries a deep link; otherwise it falls back to the name alone.
 */
export async function shareEventLink({
  eventId,
  title,
  date,
}: {
  eventId: string;
  title: string;
  date: string;
}): Promise<void> {
  const invite = `בוא נרקוד יחד באירוע "${title}"`;

  if (!isValidEventId(eventId) || !isValidDateKey(date)) {
    await Share.share({ message: invite });
    return;
  }

  const link = buildEventDeepLink(eventId, date);
  await Share.share({ message: `${invite}\n${link}`, url: link });
}
