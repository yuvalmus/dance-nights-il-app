import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import { buildCourseDeepLink } from './courseShare';

type CourseSchedule = {
  date: string;
  start_time: string;
  end_time: string;
  description?: string | null;
};

type CalendarResult = {
  created: number;
  failed: number;
};

function buildLocalDate(date: string, time: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  // Construct in local time to avoid UTC offset drift
  return new Date(year, month - 1, day, hours, minutes, 0);
}

async function getWritableCalendarId(): Promise<string | null> {
  if (Platform.OS === 'ios') {
    try {
      const defaultCal = await Calendar.getDefaultCalendarAsync();
      if (defaultCal?.id) return defaultCal.id;
    } catch {
      // fall through to calendar list
    }
  }

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  // On Android, prefer the primary writable calendar (main Google account)
  const primary = calendars.find((c) => c.allowsModifications && c.isPrimary);
  if (primary) return primary.id;

  const writable = calendars.find((c) => c.allowsModifications);
  return writable?.id ?? null;
}

export async function addCourseSchedulesToCalendar(
  schedules: CourseSchedule[],
  courseTitle: string,
  courseId: string,
  venue?: { name: string } | null,
): Promise<CalendarResult> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  // 'writeOnly' is iOS 17+ "Add Events Only" — sufficient for creating events
  if (status !== 'granted' && status !== 'writeOnly') {
    throw new Error('permission_denied');
  }

  const calendarId = await getWritableCalendarId();
  if (!calendarId) {
    throw new Error('no_calendar');
  }

  const title = venue ? `${courseTitle} — ${venue.name}` : courseTitle;
  const deepLink = buildCourseDeepLink(courseId);

  let created = 0;
  let failed = 0;

  for (const schedule of schedules) {
    try {
      const startDate = buildLocalDate(schedule.date, schedule.start_time);
      const endDate = buildLocalDate(schedule.date, schedule.end_time);

      const noteParts = [schedule.description, deepLink].filter(Boolean);
      const notes = noteParts.join('\n\n');

      await Calendar.createEventAsync(calendarId, {
        title,
        startDate,
        endDate,
        notes,
      });
      created++;
    } catch {
      failed++;
    }
  }

  return { created, failed };
}
