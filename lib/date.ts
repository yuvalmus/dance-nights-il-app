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

/**
 * Parse a YYYY-MM-DD key as a local-time Date at midnight.
 * Falls back to today when the key is empty.
 *
 * Use this (not `new Date(key)`) when feeding a date string into
 * DateTimePicker — `new Date("2026-05-12")` parses as UTC midnight,
 * which renders as the previous day in negative-offset timezones and
 * round-trips incorrectly through `toISOString()`.
 */
export function parseDateKey(key: string | undefined | null): Date {
  if (key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
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

export function getDayName(dateStr: string, isHebrew: boolean = false): string {
  const dayIndex = new Date(dateStr).getDay();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return isHebrew ? HEBREW_DAYS[days[dayIndex]] ?? days[dayIndex] : days[dayIndex];
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
// ── Hebrew month names (shared) ─────────────────────────

export const HEBREW_DAYS: Record<string, string> = {
  sunday: 'יום ראשון',
  monday: 'יום שני',
  tuesday: 'יום שלישי',
  wednesday: 'יום רביעי',
  thursday: 'יום חמישי',
  friday: 'יום שישי',
  saturday: 'שבת',
};

const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
] as const;

// ── Course date helpers ─────────────────────────────────

/** Number of days within which a course is considered "new". */
const NEW_COURSE_DAYS = 7;
const MS_IN_DAY = 24 * 60 * 60 * 1000;

/** Whether a course was created within the last NEW_COURSE_DAYS days. */
export function isNewCourse(createdAt: string): boolean {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  return diffMs < NEW_COURSE_DAYS * MS_IN_DAY;
}

/**
 * Format a dates array into a Hebrew date range string.
 * e.g. ["2026-05-12","2026-05-14"] → "12-14 במאי"
 * e.g. ["2026-05-12","2026-06-14"] → "12 במאי - 14 ביוני"
 */
export function formatCourseDateRange(dates: string[]): string | null {
  if (dates.length === 0) return null;

  const sorted = [...dates].sort();
  const currentYear = new Date().getFullYear();
  const yearSuffix = (y: number) => y !== currentYear ? ` ${y}` : '';

  const start = parseDateParts(sorted[0]);
  if (sorted.length === 1) return `${start.day} ב${start.month}${yearSuffix(start.year)}`;

  const end = parseDateParts(sorted[sorted.length - 1]);
  if (start.month === end.month && start.year === end.year) {
    return `${start.day}-${end.day} ב${start.month}${yearSuffix(start.year)}`;
  }
  if (start.year === end.year) {
    return `${start.day} ב${start.month} - ${end.day} ב${end.month}${yearSuffix(start.year)}`;
  }
  return `${start.day} ב${start.month} ${start.year} - ${end.day} ב${end.month} ${end.year}`;
}

function parseDateParts(dateStr: string) {
  const d = new Date(dateStr);
  return { day: d.getDate(), month: HEBREW_MONTHS[d.getMonth()], year: d.getFullYear() };
}

// ── Event live helpers ──────────────────────────────────

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
