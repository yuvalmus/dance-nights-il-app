-- 026: Scheduled notification jobs (event reminder + course-starting-this-week).
--
-- Both jobs run on `pg_cron`. The extension is available on Supabase but must
-- be enabled in the dashboard (Database → Extensions → pg_cron). If it isn't,
-- the cron.schedule calls at the bottom of this file will fail — the rest of
-- the migration (functions) is still valid. Re-run after enabling.
--
-- Each function is idempotent: the inbox dedup is enforced by group_key
-- (one notification ever per (user, event/course, occurrence)). The cron
-- cadence can be tuned without changing the SQL logic.

-- 1. ~2h event reminder ----------------------------------------------------
--
-- Fires for any registrant of an event whose date matches today's date and
-- whose first scheduled time falls within the next two hours.
--
-- The "first scheduled time" lookup falls back to the event date alone when
-- the event has no schedule rows yet (some events publish without an exact
-- start time).

CREATE OR REPLACE FUNCTION public.send_event_reminders()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_rec   RECORD;
  v_uid   UUID;
  v_count INTEGER := 0;
BEGIN
  FOR v_rec IN
    SELECT e.id    AS event_id,
           e.title AS title,
           e.date  AS event_date,
           es.time AS start_time
      FROM public.events e
      LEFT JOIN LATERAL (
        SELECT time
          FROM public.event_schedules
         WHERE event_id = e.id
         ORDER BY sort_order ASC
         LIMIT 1
      ) es ON TRUE
     WHERE e.is_published = TRUE
       AND e.date = CURRENT_DATE
       AND (
         es.time IS NULL
         OR (e.date + es.time)::timestamptz
              BETWEEN now() AND now() + interval '2 hours'
       )
  LOOP
    FOR v_uid IN
      SELECT user_id FROM public.registrations WHERE event_id = v_rec.event_id
    LOOP
      PERFORM public.insert_notification_once(
        v_uid,
        'event_reminder',
        'האירוע מתחיל בקרוב',
        '"' || COALESCE(v_rec.title, '') || '" מתחיל בעוד כשעתיים',
        jsonb_build_object(
          'event_id',  v_rec.event_id,
          'deep_link', '/?eventId=' || v_rec.event_id::text || '&date=' || v_rec.event_date::text
        ),
        'event_reminder:' || v_rec.event_id::text,
        true
      );
      v_count := v_count + 1;
    END LOOP;
  END LOOP;

  RETURN v_count;
END;
$$;

-- 2. "Course starting this week" -----------------------------------------
--
-- One notification per (course, registrant) emitted the day a course's first
-- session falls within the upcoming seven-day window. Subsequent runs of the
-- cron job are no-ops because the group_key is the course id.

CREATE OR REPLACE FUNCTION public.send_course_starting_this_week()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_rec   RECORD;
  v_uid   UUID;
  v_count INTEGER := 0;
BEGIN
  FOR v_rec IN
    SELECT c.id    AS course_id,
           c.title AS title,
           cs.date AS start_date
      FROM public.courses c
      JOIN LATERAL (
        SELECT date
          FROM public.course_schedules
         WHERE course_id = c.id
         ORDER BY date ASC
         LIMIT 1
      ) cs ON TRUE
     WHERE c.is_published = TRUE
       AND c.approval_status IN ('approved', 'not_required')
       AND cs.date BETWEEN CURRENT_DATE AND CURRENT_DATE + interval '7 days'
  LOOP
    FOR v_uid IN
      SELECT user_id FROM public.registrations WHERE course_id = v_rec.course_id
    LOOP
      PERFORM public.insert_notification_once(
        v_uid,
        'course_starting_this_week',
        'קורס נפתח השבוע',
        'הקורס "' || COALESCE(v_rec.title, '') || '" מתחיל ב-' || v_rec.start_date::text,
        jsonb_build_object(
          'course_id',  v_rec.course_id,
          'start_date', v_rec.start_date,
          'deep_link',  '/course/' || v_rec.course_id::text
        ),
        'course_starting:' || v_rec.course_id::text,
        true
      );
      v_count := v_count + 1;
    END LOOP;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.send_event_reminders()             FROM public;
REVOKE ALL ON FUNCTION public.send_course_starting_this_week()   FROM public;

-- pg_cron schedules -------------------------------------------------------
--
-- Wrapped in DO blocks so the migration runs even on environments without
-- pg_cron enabled — the body raises a NOTICE and skips silently. Enable the
-- extension and re-run this migration (or re-issue the cron.schedule calls)
-- to activate.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'event-reminders',
      '*/15 * * * *',
      $cron$ SELECT public.send_event_reminders(); $cron$
    );
    PERFORM cron.schedule(
      'course-starting-this-week',
      '0 9 * * *',
      $cron$ SELECT public.send_course_starting_this_week(); $cron$
    );
  ELSE
    RAISE NOTICE 'pg_cron not enabled — schedules for event/course reminders skipped';
  END IF;
END;
$$;
