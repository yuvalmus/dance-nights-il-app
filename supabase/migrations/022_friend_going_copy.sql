-- 022: Drop the gendered slash forms from the "friend is going" notification.
--
-- Migration 020 wrote the notification copy with dual-gender slashes
-- (חבר/ה, מתכוון/ת, מצטרפ/ת). They read awkwardly, so this re-defines the
-- function with the plain masculine form used as the app-wide default.
-- Only the three Hebrew strings change; the dedupe logic is untouched.

CREATE OR REPLACE FUNCTION public.notify_friends_on_going()
RETURNS TRIGGER AS $$
DECLARE
  actor_name     TEXT;
  activity_title TEXT;
  notif_type     TEXT;
  body_text      TEXT;
  cutoff         TIMESTAMPTZ := now() - interval '24 hours';
BEGIN
  SELECT display_name INTO actor_name
    FROM public.profiles WHERE id = NEW.user_id;

  IF NEW.event_id IS NOT NULL THEN
    SELECT title INTO activity_title
      FROM public.events WHERE id = NEW.event_id;
    notif_type := 'friend_going_event';
  ELSE
    SELECT title INTO activity_title
      FROM public.courses WHERE id = NEW.course_id;
    notif_type := 'friend_going_course';
  END IF;

  body_text := COALESCE(actor_name, 'חבר')
            || ' מתכוון להגיע ל"'
            || COALESCE(activity_title, '')
            || '"';

  INSERT INTO public.notifications (user_id, type, title, body, data)
  SELECT
    f.user_id,
    notif_type,
    'חבר מצטרף',
    body_text,
    jsonb_build_object(
      'registration_id', NEW.id,
      'actor_id',        NEW.user_id,
      'event_id',        NEW.event_id,
      'course_id',       NEW.course_id
    )
  FROM public.friendships f
  WHERE f.friend_id = NEW.user_id
    AND f.status = 'accepted'
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
       WHERE n.user_id = f.user_id
         AND n.type = notif_type
         AND n.created_at >= cutoff
         AND (n.data->>'actor_id')::uuid = NEW.user_id
         AND COALESCE(n.data->>'event_id',  '') = COALESCE(NEW.event_id::text,  '')
         AND COALESCE(n.data->>'course_id', '') = COALESCE(NEW.course_id::text, '')
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
