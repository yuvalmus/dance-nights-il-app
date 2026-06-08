-- 025: Notification triggers v2 — every writer goes through upsert_notification.
--
-- The v1 triggers from 017/020 fan-inserted a row per recipient per event.
-- v2 collapses recurring activity into a single (user_id, group_key) row
-- whose body is recomputed on each new actor. The push pipeline (Edge
-- Function + last_push_at) handles delivery debouncing separately — this
-- layer just owns the in-app inbox state.
--
-- Naming convention for group_key: `<topic>:<scope_id>` so the human reader
-- can grep a payload and immediately tell the dedup contract.

-- 1. Friends going (aggregated) --------------------------------------------
--
-- When friend A marks "going" to event/course X, every accepted friend of A
-- gets at most ONE notification per X. data.actors[] accumulates the list of
-- friends, and the Hebrew body is rebuilt by build_friends_going_body().
-- 24h per-actor dedup prevents toggle spam.

CREATE OR REPLACE FUNCTION public.notify_friends_on_going_v2()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_id       UUID    := NEW.user_id;
  v_actor_name     TEXT;
  v_activity_kind  TEXT    := CASE WHEN NEW.event_id IS NOT NULL THEN 'event' ELSE 'course' END;
  v_activity_id    UUID    := COALESCE(NEW.event_id, NEW.course_id);
  v_activity_title TEXT;
  v_group_key      TEXT;
  v_deep_link      TEXT;
  v_friend_id      UUID;
  v_existing       public.notifications;
  v_data           JSONB;
  v_body           TEXT;
  v_recent_actor   BOOLEAN;
BEGIN
  SELECT display_name INTO v_actor_name FROM public.profiles WHERE id = v_actor_id;

  IF NEW.event_id IS NOT NULL THEN
    SELECT title INTO v_activity_title FROM public.events  WHERE id = NEW.event_id;
    v_deep_link := '/?eventId=' || NEW.event_id::text;
  ELSE
    SELECT title INTO v_activity_title FROM public.courses WHERE id = NEW.course_id;
    v_deep_link := '/course/' || NEW.course_id::text;
  END IF;

  v_group_key := 'friends_going:' || v_activity_kind || ':' || v_activity_id::text;

  FOR v_friend_id IN
    SELECT f.user_id
      FROM public.friendships f
     WHERE f.friend_id = v_actor_id AND f.status = 'accepted'
  LOOP
    SELECT * INTO v_existing
      FROM public.notifications
     WHERE user_id = v_friend_id AND group_key = v_group_key
     LIMIT 1;

    IF v_existing.id IS NULL THEN
      v_data := jsonb_build_object(
        'activity_kind',  v_activity_kind,
        'activity_id',    v_activity_id,
        'activity_title', COALESCE(v_activity_title, ''),
        'deep_link',      v_deep_link,
        'actors', jsonb_build_array(jsonb_build_object(
          'id',           v_actor_id,
          'display_name', v_actor_name,
          'at',           to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
        ))
      );

      INSERT INTO public.notifications
        (user_id, type, title, body, data, group_key, push_eligible)
      VALUES
        (v_friend_id, 'friends_going', 'חברים מגיעים',
         public.build_friends_going_body(v_data),
         v_data, v_group_key, true);

      CONTINUE;
    END IF;

    -- 24h per-actor dedup — if the same friend bounced off "going" and back
    -- within the window, don't surface them again as a brand new alert.
    SELECT EXISTS (
      SELECT 1
        FROM jsonb_array_elements(COALESCE(v_existing.data->'actors', '[]'::jsonb)) a
       WHERE (a->>'id')::uuid = v_actor_id
         AND (a->>'at')::timestamptz > now() - interval '24 hours'
    ) INTO v_recent_actor;

    IF v_recent_actor THEN
      CONTINUE;
    END IF;

    v_data := public.merge_friend_actor(v_existing.data, v_actor_id, v_actor_name);
    v_body := public.build_friends_going_body(v_data);

    UPDATE public.notifications
       SET data          = v_data,
           body          = v_body,
           updated_at    = now(),
           sort_at       = now(),
           read_at       = NULL,
           push_eligible = true
     WHERE id = v_existing.id;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_friends_on_going_v2
  AFTER INSERT ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.notify_friends_on_going_v2();

-- When the friend un-marks, remove them from each friend's aggregated card.
-- An empty actors[] deletes the row outright; otherwise we recompute the body.
CREATE OR REPLACE FUNCTION public.clear_friends_going_on_delete()
RETURNS TRIGGER AS $$
DECLARE
  v_activity_kind TEXT := CASE WHEN OLD.event_id IS NOT NULL THEN 'event' ELSE 'course' END;
  v_activity_id   UUID := COALESCE(OLD.event_id, OLD.course_id);
  v_group_key     TEXT := 'friends_going:' || v_activity_kind || ':' || v_activity_id::text;
  v_row           public.notifications;
  v_remaining     JSONB;
  v_new_data      JSONB;
BEGIN
  FOR v_row IN
    SELECT n.*
      FROM public.notifications n
      JOIN public.friendships  f ON f.user_id = n.user_id
     WHERE f.friend_id   = OLD.user_id
       AND f.status      = 'accepted'
       AND n.group_key   = v_group_key
  LOOP
    SELECT COALESCE(jsonb_agg(a), '[]'::jsonb)
      INTO v_remaining
      FROM jsonb_array_elements(COALESCE(v_row.data->'actors', '[]'::jsonb)) a
     WHERE (a->>'id')::uuid <> OLD.user_id;

    IF jsonb_array_length(v_remaining) = 0 THEN
      DELETE FROM public.notifications WHERE id = v_row.id;
    ELSE
      v_new_data := v_row.data || jsonb_build_object('actors', v_remaining);
      UPDATE public.notifications
         SET data       = v_new_data,
             body       = public.build_friends_going_body(v_new_data),
             updated_at = now(),
             sort_at    = now()
       WHERE id = v_row.id;
    END IF;
  END LOOP;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_clear_friends_going_on_delete
  AFTER DELETE ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.clear_friends_going_on_delete();

-- 2. Friend request (group_key per requester → re-sends dedupe) -----------

CREATE OR REPLACE FUNCTION public.notify_on_friend_request_v2()
RETURNS TRIGGER AS $$
DECLARE
  v_name TEXT;
BEGIN
  IF pg_trigger_depth() > 1 OR NEW.status <> 'pending' THEN
    RETURN NEW;
  END IF;

  SELECT display_name INTO v_name
    FROM public.profiles WHERE id = NEW.requested_by;

  PERFORM public.upsert_notification(
    NEW.friend_id,
    'friend_request',
    'בקשת חברות חדשה',
    COALESCE(v_name, 'משתמש') || ' שלח לך בקשת חברות',
    jsonb_build_object(
      'requester_id', NEW.requested_by,
      'deep_link',    '/profile/friends'
    ),
    'friend_request:' || NEW.requested_by::text,
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_on_friend_request_v2
  AFTER INSERT ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_friend_request_v2();

-- 3. Friend accepted (notify requester, clear stale request card) ---------

CREATE OR REPLACE FUNCTION public.notify_on_friend_accepted_v2()
RETURNS TRIGGER AS $$
DECLARE
  v_name TEXT;
BEGIN
  IF pg_trigger_depth() > 1 THEN RETURN NEW; END IF;
  IF OLD.status <> 'pending' OR NEW.status <> 'accepted' THEN RETURN NEW; END IF;

  -- The recipient's "pending request" card is no longer actionable.
  DELETE FROM public.notifications
    WHERE user_id   = NEW.user_id
      AND group_key = 'friend_request:' || NEW.friend_id::text;

  SELECT display_name INTO v_name
    FROM public.profiles WHERE id = NEW.friend_id;

  PERFORM public.upsert_notification(
    NEW.requested_by,
    'friend_accepted',
    'בקשת החברות אושרה',
    COALESCE(v_name, 'משתמש') || ' אישר את בקשת החברות שלך',
    jsonb_build_object(
      'friend_id', NEW.friend_id,
      'deep_link', '/profile/friends'
    ),
    'friend_accepted:' || NEW.friend_id::text,
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_on_friend_accepted_v2
  AFTER UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_friend_accepted_v2();

-- Decline / rescind / unfriend → drop the pending-request card if any.
-- The recipient is the side whose user_id is NOT the requester.
CREATE OR REPLACE FUNCTION public.clear_friend_request_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN RETURN OLD; END IF;

  DELETE FROM public.notifications
    WHERE group_key = 'friend_request:' || OLD.requested_by::text
      AND user_id IN (OLD.user_id, OLD.friend_id)
      AND user_id <> OLD.requested_by;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_clear_friend_request_on_delete
  AFTER DELETE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.clear_friend_request_on_delete();

-- 4. Instructor invite (affiliation INSERT pending) -----------------------

CREATE OR REPLACE FUNCTION public.notify_on_instructor_invite()
RETURNS TRIGGER AS $$
DECLARE
  v_venue_name TEXT;
BEGIN
  IF NEW.status <> 'pending' THEN RETURN NEW; END IF;

  SELECT name INTO v_venue_name FROM public.venues WHERE id = NEW.venue_id;

  PERFORM public.upsert_notification(
    NEW.user_id,
    'instructor_invite',
    'הוזמנת ללמד',
    COALESCE(v_venue_name, 'מקום') || ' הזמינו אותך ללמד',
    jsonb_build_object(
      'affiliation_id', NEW.id,
      'venue_id',       NEW.venue_id,
      'venue_name',     v_venue_name,
      'deep_link',      '/profile'
    ),
    'instructor_invite:' || NEW.id::text,
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_on_instructor_invite
  AFTER INSERT ON public.venue_affiliations
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_instructor_invite();

-- Once the instructor responds, the invite card is no longer actionable.
CREATE OR REPLACE FUNCTION public.clear_instructor_invite_on_response()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status IN ('active', 'revoked') THEN
    DELETE FROM public.notifications
      WHERE user_id   = NEW.user_id
        AND group_key = 'instructor_invite:' || NEW.id::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_clear_instructor_invite_on_response
  AFTER UPDATE OF status ON public.venue_affiliations
  FOR EACH ROW EXECUTE FUNCTION public.clear_instructor_invite_on_response();

-- 5. Instructor left venue (rewrite of v1 in 017) -------------------------

CREATE OR REPLACE FUNCTION public.notify_owner_on_instructor_leave_v2()
RETURNS TRIGGER AS $$
DECLARE
  v_owner      UUID;
  v_venue_name TEXT;
  v_name       TEXT;
BEGIN
  IF NOT (OLD.status = 'active' AND NEW.status = 'revoked') THEN RETURN NEW; END IF;
  -- Self-leave only — owner-initiated revokes should not notify the owner.
  IF auth.uid() IS NULL OR auth.uid() <> NEW.user_id THEN RETURN NEW; END IF;

  SELECT v.owner_id, v.name
    INTO v_owner, v_venue_name
    FROM public.venues v WHERE v.id = NEW.venue_id;

  IF v_owner IS NULL THEN RETURN NEW; END IF;

  SELECT display_name INTO v_name
    FROM public.profiles WHERE id = NEW.user_id;

  PERFORM public.upsert_notification(
    v_owner,
    'instructor_left_venue',
    'מדריך עזב את המקום',
    COALESCE(v_name, 'מדריך') || ' עזב את ' || COALESCE(v_venue_name, 'המקום שלך'),
    jsonb_build_object(
      'venue_id',       NEW.venue_id,
      'user_id',        NEW.user_id,
      'affiliation_id', NEW.id,
      'deep_link',      '/profile'
    ),
    'instructor_left:' || NEW.id::text,
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER notify_owner_on_instructor_leave_v2
  AFTER UPDATE ON public.venue_affiliations
  FOR EACH ROW EXECUTE FUNCTION public.notify_owner_on_instructor_leave_v2();

-- 6. Course approval lifecycle --------------------------------------------
--
-- Three transitions matter for notifications:
--   * → pending_owner_review : notify the venue owner (inbox card with actions)
--   * → approved             : notify the artist (and clear the owner's pending card)
--   * → rejected             : notify the artist (and clear the owner's pending card)

CREATE OR REPLACE FUNCTION public.notify_on_course_pending_approval()
RETURNS TRIGGER AS $$
DECLARE
  v_owner        UUID;
  v_venue_name   TEXT;
  v_creator_name TEXT;
BEGIN
  IF NEW.approval_status <> 'pending_owner_review' THEN RETURN NEW; END IF;
  IF NEW.venue_id IS NULL THEN RETURN NEW; END IF;

  -- On UPDATE, only fire on a fresh transition INTO pending.
  IF TG_OP = 'UPDATE' AND OLD.approval_status = 'pending_owner_review' THEN
    RETURN NEW;
  END IF;

  SELECT owner_id, name INTO v_owner, v_venue_name
    FROM public.venues WHERE id = NEW.venue_id;
  IF v_owner IS NULL OR v_owner = NEW.created_by THEN RETURN NEW; END IF;

  SELECT display_name INTO v_creator_name
    FROM public.profiles WHERE id = NEW.created_by;

  PERFORM public.upsert_notification(
    v_owner,
    'course_pending_approval',
    'קורס ממתין לאישור',
    COALESCE(v_creator_name, 'מדריך') || ' הגיש קורס לאישור ב' || COALESCE(v_venue_name, 'מקום שלך'),
    jsonb_build_object(
      'course_id',    NEW.id,
      'course_title', NEW.title,
      'creator_id',   NEW.created_by,
      'venue_id',     NEW.venue_id,
      'deep_link',    '/profile/manage'
    ),
    'course_pending:' || NEW.id::text,
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_course_pending_insert
  AFTER INSERT ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_course_pending_approval();

CREATE TRIGGER trigger_notify_course_pending_update
  AFTER UPDATE OF approval_status ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_course_pending_approval();

CREATE OR REPLACE FUNCTION public.notify_on_course_approval_change()
RETURNS TRIGGER AS $$
DECLARE
  v_type  TEXT;
  v_title TEXT;
  v_body  TEXT;
BEGIN
  IF OLD.approval_status = NEW.approval_status THEN RETURN NEW; END IF;
  IF NEW.approval_status NOT IN ('approved', 'rejected') THEN RETURN NEW; END IF;
  IF NEW.created_by IS NULL THEN RETURN NEW; END IF;

  -- Owner's queue card is done either way.
  DELETE FROM public.notifications
    WHERE group_key = 'course_pending:' || NEW.id::text;

  IF NEW.approval_status = 'approved' THEN
    v_type  := 'course_approved';
    v_title := 'הקורס אושר';
    v_body  := 'הקורס "' || COALESCE(NEW.title, '') || '" אושר על ידי בעלי המקום';
  ELSE
    v_type  := 'course_rejected';
    v_title := 'הקורס נדחה';
    v_body  := 'הקורס "' || COALESCE(NEW.title, '') || '" לא אושר על ידי בעלי המקום';
  END IF;

  PERFORM public.upsert_notification(
    NEW.created_by,
    v_type,
    v_title,
    v_body,
    jsonb_build_object(
      'course_id',    NEW.id,
      'course_title', NEW.title,
      'venue_id',     NEW.venue_id,
      'deep_link',    '/course/' || NEW.id::text
    ),
    v_type || ':' || NEW.id::text,
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_course_approval_change
  AFTER UPDATE OF approval_status ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_course_approval_change();

-- 7. Event date change → registrants only (rewrite of v1) -----------------

CREATE OR REPLACE FUNCTION public.notify_on_event_date_changed()
RETURNS TRIGGER AS $$
DECLARE
  v_body TEXT;
  v_uid  UUID;
BEGIN
  IF OLD.date IS NOT DISTINCT FROM NEW.date THEN RETURN NEW; END IF;

  v_body := 'התאריך של "' || COALESCE(NEW.title, '') || '" השתנה ל-' || NEW.date::text;

  FOR v_uid IN SELECT user_id FROM public.registrations WHERE event_id = NEW.id LOOP
    PERFORM public.upsert_notification(
      v_uid,
      'event_date_changed',
      'תאריך אירוע השתנה',
      v_body,
      jsonb_build_object(
        'event_id',  NEW.id,
        'old_date',  OLD.date,
        'new_date',  NEW.date,
        'deep_link', '/?eventId=' || NEW.id::text || '&date=' || NEW.date::text
      ),
      'event_date_changed:' || NEW.id::text,
      true
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_event_date_change_v2
  AFTER UPDATE OF date ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_event_date_changed();

-- 8. Event cancelled (is_published true → false on a future event) --------

CREATE OR REPLACE FUNCTION public.notify_on_event_cancelled()
RETURNS TRIGGER AS $$
DECLARE
  v_body TEXT;
  v_uid  UUID;
BEGIN
  IF NOT (OLD.is_published = true AND NEW.is_published = false) THEN
    RETURN NEW;
  END IF;
  IF NEW.date < CURRENT_DATE THEN RETURN NEW; END IF;

  v_body := 'האירוע "' || COALESCE(NEW.title, '') || '" בוטל';

  FOR v_uid IN SELECT user_id FROM public.registrations WHERE event_id = NEW.id LOOP
    PERFORM public.upsert_notification(
      v_uid,
      'event_cancelled',
      'אירוע בוטל',
      v_body,
      jsonb_build_object(
        'event_id',  NEW.id,
        'deep_link', '/'
      ),
      'event_cancelled:' || NEW.id::text,
      true
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_on_event_cancelled
  AFTER UPDATE OF is_published ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_event_cancelled();

-- 9. Registration spike for owners (10 / 25 / 50 / 100 milestones) --------

CREATE OR REPLACE FUNCTION public.notify_on_registration_spike()
RETURNS TRIGGER AS $$
DECLARE
  v_owner     UUID;
  v_title     TEXT;
  v_count     INTEGER;
  v_threshold INTEGER := NULL;
  v_check     INTEGER;
BEGIN
  IF NEW.event_id IS NULL THEN RETURN NEW; END IF;

  SELECT v.owner_id, e.title
    INTO v_owner, v_title
    FROM public.events e
    JOIN public.venues v ON v.id = e.venue_id
   WHERE e.id = NEW.event_id;

  IF v_owner IS NULL OR v_owner = NEW.user_id THEN RETURN NEW; END IF;

  SELECT count(*)::int INTO v_count
    FROM public.registrations WHERE event_id = NEW.event_id;

  FOREACH v_check IN ARRAY ARRAY[10, 25, 50, 100] LOOP
    IF v_count = v_check THEN
      v_threshold := v_check;
      EXIT;
    END IF;
  END LOOP;

  IF v_threshold IS NULL THEN RETURN NEW; END IF;

  PERFORM public.upsert_notification(
    v_owner,
    'registration_spike',
    'מומנטום באירוע שלך',
    v_count::text || ' אנשים סימנו הגעה ל"' || COALESCE(v_title, '') || '"',
    jsonb_build_object(
      'event_id',  NEW.event_id,
      'count',     v_count,
      'threshold', v_threshold,
      'deep_link', '/profile/manage'
    ),
    'registration_spike:event:' || NEW.event_id::text,
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_on_registration_spike
  AFTER INSERT ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_registration_spike();

-- 10. Spots running low (one-shot per user per event) ---------------------
--
-- Fires on UPDATE of registration_links (where spots_total/spots_taken live).
-- Uses insert_notification_once so a re-fire after spots fluctuate doesn't
-- bump the inbox row back to unread.

CREATE OR REPLACE FUNCTION public.notify_on_spots_low()
RETURNS TRIGGER AS $$
DECLARE
  v_total     INTEGER := 0;
  v_taken     INTEGER := 0;
  v_remaining INTEGER;
  v_link      JSONB;
  v_uid       UUID;
  v_body      TEXT;
BEGIN
  IF NOT NEW.pre_register THEN RETURN NEW; END IF;

  FOR v_link IN
    SELECT * FROM jsonb_array_elements(COALESCE(NEW.registration_links, '[]'::jsonb))
  LOOP
    IF v_link->>'spots_total' IS NOT NULL THEN
      v_total := v_total + COALESCE((v_link->>'spots_total')::int, 0);
      v_taken := v_taken + COALESCE((v_link->>'spots_taken')::int, 0);
    END IF;
  END LOOP;

  IF v_total = 0 THEN RETURN NEW; END IF;
  v_remaining := v_total - v_taken;

  -- "low" = ≤5 absolute OR ≤10% of total.
  IF NOT (v_remaining <= 5 OR v_remaining * 10 <= v_total) THEN
    RETURN NEW;
  END IF;

  v_body := 'נשארו מעט מקומות ב"' || COALESCE(NEW.title, '') || '"';

  FOR v_uid IN SELECT user_id FROM public.registrations WHERE event_id = NEW.id LOOP
    PERFORM public.insert_notification_once(
      v_uid,
      'spots_low',
      'מעט מקומות נותרו',
      v_body,
      jsonb_build_object(
        'event_id',  NEW.id,
        'remaining', v_remaining,
        'deep_link', '/?eventId=' || NEW.id::text
      ),
      'spots_low:event:' || NEW.id::text,
      true
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_on_spots_low
  AFTER UPDATE OF registration_links ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_spots_low();

-- 11. Favourite venue → new published event -------------------------------
--
-- Fires when a published event appears at a favourited venue (INSERT with
-- is_published=true, or an UPDATE flipping false → true). Daily dedup via a
-- group_key scoped to the date: each user gets at most one notification per
-- (venue, day).

CREATE OR REPLACE FUNCTION public.notify_on_favorite_venue_event()
RETURNS TRIGGER AS $$
DECLARE
  v_venue_name TEXT;
  v_uid        UUID;
BEGIN
  IF NEW.is_published IS NOT TRUE THEN RETURN NEW; END IF;

  IF TG_OP = 'UPDATE' AND OLD.is_published = true THEN
    RETURN NEW;
  END IF;

  SELECT name INTO v_venue_name FROM public.venues WHERE id = NEW.venue_id;

  FOR v_uid IN
    SELECT user_id FROM public.user_favorites
     WHERE target_type = 'venue' AND target_id = NEW.venue_id
  LOOP
    PERFORM public.insert_notification_once(
      v_uid,
      'favorite_venue_event',
      'אירוע חדש במקום מועדף',
      'אירוע חדש ב' || COALESCE(v_venue_name, 'מקום שאהבת') || ': "' || COALESCE(NEW.title, '') || '"',
      jsonb_build_object(
        'venue_id',   NEW.venue_id,
        'event_id',   NEW.id,
        'venue_name', v_venue_name,
        'deep_link',  '/?eventId=' || NEW.id::text || '&date=' || NEW.date::text
      ),
      'favorite_venue_event:' || NEW.venue_id::text || ':' || to_char(now(), 'YYYY-MM-DD'),
      true
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_favorite_venue_event_insert
  AFTER INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_favorite_venue_event();

CREATE TRIGGER trigger_notify_favorite_venue_event_update
  AFTER UPDATE OF is_published ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_favorite_venue_event();

-- 12. Favourite artist → new approved course ------------------------------

CREATE OR REPLACE FUNCTION public.notify_on_favorite_artist_course()
RETURNS TRIGGER AS $$
DECLARE
  v_artist_name TEXT;
  v_artist_id   UUID;
  v_uid         UUID;
BEGIN
  -- Only when the course becomes both approved and published.
  IF NEW.is_published IS NOT TRUE THEN RETURN NEW; END IF;
  IF NEW.approval_status NOT IN ('approved', 'not_required') THEN RETURN NEW; END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.is_published = true
       AND OLD.approval_status IN ('approved', 'not_required') THEN
      RETURN NEW;
    END IF;
  END IF;

  v_artist_id := COALESCE(NEW.instructor_id, NEW.created_by);
  IF v_artist_id IS NULL THEN RETURN NEW; END IF;

  SELECT display_name INTO v_artist_name
    FROM public.profiles WHERE id = v_artist_id;

  FOR v_uid IN
    SELECT user_id FROM public.user_favorites
     WHERE target_type = 'artist' AND target_id = v_artist_id
  LOOP
    PERFORM public.insert_notification_once(
      v_uid,
      'favorite_artist_course',
      'קורס חדש ממדריך מועדף',
      COALESCE(v_artist_name, 'מדריך שאהבת') || ' פתח קורס חדש: "' || COALESCE(NEW.title, '') || '"',
      jsonb_build_object(
        'artist_id',   v_artist_id,
        'course_id',   NEW.id,
        'artist_name', v_artist_name,
        'deep_link',   '/course/' || NEW.id::text
      ),
      'favorite_artist_course:' || v_artist_id::text || ':' || to_char(now(), 'YYYY-MM-DD'),
      true
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_favorite_artist_course_insert
  AFTER INSERT ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_favorite_artist_course();

CREATE TRIGGER trigger_notify_favorite_artist_course_update
  AFTER UPDATE OF is_published, approval_status ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_favorite_artist_course();
