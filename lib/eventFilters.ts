import { EventWithVenue } from '@/types/database';
import { isEventLive } from '@/lib/date';

export function filterEvents(
  events: EventWithVenue[],
  danceStyle: string | null,
  liveOnly: boolean,
): EventWithVenue[] {
  let filtered = danceStyle
    ? events.filter((e) => e.dance_styles.includes(danceStyle))
    : [...events];

  if (liveOnly) {
    filtered = filtered.filter((e) => isEventLive(e.date, e.schedules?.[0]?.time));
  }

  return filtered.sort((a, b) => {
    const aLive = isEventLive(a.date, a.schedules?.[0]?.time) ? 0 : 1;
    const bLive = isEventLive(b.date, b.schedules?.[0]?.time) ? 0 : 1;
    if (aLive !== bLive) return aLive - bLive;
    return a.distance_meters - b.distance_meters;
  });
}
