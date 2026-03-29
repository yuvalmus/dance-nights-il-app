/**
 * Date helpers for a nightlife app.
 *
 * Events run late — a party starting at 21:00 may go until 4-5am.
 * We consider an event "live" from its first schedule time until
 * DAY_BOUNDARY_HOUR the next morning.
 */

/** Hour at which events from the previous night are no longer considered live. */
export const DAY_BOUNDARY_HOUR = 5;

/** Format a Date as YYYY-MM-DD in local time. */
export function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Format a time string (e.g. "20:00:00") as HH:mm, dropping seconds. */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes}`;
}

/** Get today's date key (plain local date, no shifting). */
export function getTodayKey(): string {
  return formatDateKey(new Date());
}

/** Whether we're in the midnight–5am boundary window (still partying from last night). */
export function isInBoundaryWindow(): boolean {
  return new Date().getHours() < DAY_BOUNDARY_HOUR;
}

/** Get last night's date key (yesterday). Used during the boundary window. */
export function getLastNightKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDateKey(d);
}

/**
 * Check whether an event is currently live.
 *
 * An event is live from its first schedule time on `eventDate`
 * until DAY_BOUNDARY_HOUR (5am) the following morning.
 *
 * @param eventDate  - YYYY-MM-DD string
 * @param firstTime  - HH:MM string (e.g. "21:00")
 */
export function isEventLive(eventDate: string, firstTime: string | undefined): boolean {
  if (!firstTime) return false;

  const now = new Date();

  // Parse event start
  const [year, month, day] = eventDate.split('-').map(Number);
  const [hour, minute] = firstTime.split(':').map(Number);
  const start = new Date(year, month - 1, day, hour, minute);

  // End = next day at DAY_BOUNDARY_HOUR
  const end = new Date(year, month - 1, day + 1, DAY_BOUNDARY_HOUR, 0);

  return now >= start && now < end;
}
