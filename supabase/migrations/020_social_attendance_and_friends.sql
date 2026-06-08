-- 020: Social attendance + friendships
--
-- Two product surfaces share this migration:
--
--   * `registrations` — per-user "going" intent for an event OR a course.
--     Reads are own-rows-only; friend visibility flows through SECURITY
--     DEFINER RPCs so no client can enumerate "who is going where".
--
--   * `friendships` — mirrored edges (one row per direction). Direct
--     INSERT/UPDATE/DELETE is revoked; lifecycle goes through RPCs
--     (request, accept, block, remove). A trigger mirrors status changes
--     across the two rows so a single SELECT side-tells the truth.
--
-- Notifications:
--
--   * Friend marks "going": notifies accepted friends, deduped to one
--     notification per (friend, activity) per 24h. Toggle-spam protection.
--     The notification stores the source `registration_id`, so an AFTER
--     DELETE trigger on registrations cleans the inbox if the friend
--     un-marks.
--
--   * Event date change: notifies every user with a registration on that
--     event. Registrations themselves are kept — only the date moved.

-- 1. Friendship status enum -------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'friendship_status') THEN
    CREATE TYPE friendship_status AS ENUM ('pending', 'accepted', 'blocked');
  END IF;
END $$;

-- 2. registrations ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.registrations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id)   ON DELETE CASCADE,
  event_id    UUID REFERENCES public.events(id)         ON DELETE CASCADE,
  course_id   UUID REFERENCES public.courses(id)        ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT registration_target_check CHECK (
    (event_id IS NOT NULL AND course_id IS NULL) OR
    (event_id IS NULL     AND course_id IS NOT NULL)
  )
);

-- Postgres treats NULL as distinct in UNIQUE indexes, so an inline
-- UNIQUE(user_id, event_id) wouldn't dedupe course rows the way you'd
-- expect. Two partial indexes make the intent explicit per branch.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_registrations_user_event
  ON public.registrations (user_id, event_id) WHERE event_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_registrations_user_course
  ON public.registrations (user_id, course_id) WHERE course_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_registrations_event
  ON public.registrations (event_id) WHERE event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_registrations_course
  ON public.registrations (course_id) WHERE course_id IS NOT NULL;

-- 3. friendships (mirrored) -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.friendships (
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status        friendship_status NOT NULL DEFAULT 'pending',
  requested_by  UUID NOT NULL REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, friend_id),
  CONSTRAINT friend_not_self CHECK (user_id <> friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user_status
  ON public.friendships (user_id, status);

-- 4. RLS --------------------------------------------------------------------
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships  ENABLE ROW LEVEL SECURITY;

-- Registrations: own rows only. Anything else flows through the RPCs.
CREATE POLICY "Reg: read own" ON public.registrations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Reg: insert own" ON public.registrations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Reg: delete own" ON public.registrations
  FOR DELETE USING (user_id = auth.uid());
-- (no UPDATE — registration is binary; toggle off = delete)

-- Friendships: edges that involve the caller, either direction. Mirroring
-- guarantees both sides stay aligned, so own-side-only is enough.
CREATE POLICY "Fri: read own edges" ON public.friendships
  FOR SELECT USING (user_id = auth.uid() OR friend_id = auth.uid());

REVOKE INSERT, UPDATE, DELETE ON public.friendships FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.friendships FROM anon;

-- 5. Mirror trigger ---------------------------------------------------------
-- Keeps the two directional rows in sync. Recursion guarded by depth check.
CREATE OR REPLACE FUNCTION public.handle_friendship_mirror()
RETURNS TRIGGER AS $$
BEGIN
  IF (pg_trigger_depth() > 1) THEN
    RETURN NEW;
  END IF;

  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.friendships
      (user_id, friend_id, status, requested_by, created_at, updated_at)
    VALUES
      (NEW.friend_id, NEW.user_id, NEW.status, NEW.requested_by, NEW.created_at, NEW.updated_at)
    ON CONFLICT (user_id, friend_id) DO NOTHING;

  ELSIF (TG_OP = 'UPDATE') THEN
    UPDATE public.friendships
       SET status = NEW.status,
           updated_at = NEW.updated_at
     WHERE user_id = NEW.friend_id AND friend_id = NEW.user_id;

  ELSIF (TG_OP = 'DELETE') THEN
    DELETE FROM public.friendships
     WHERE user_id = OLD.friend_id AND friend_id = OLD.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_mirror_friendship
  AFTER INSERT OR UPDATE OR DELETE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.handle_friendship_mirror();

-- updated_at touch — saves the app from having to pass it explicitly.
CREATE OR REPLACE FUNCTION public.touch_friendship_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_touch_friendship_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.touch_friendship_updated_at();

-- 6. Friendship lifecycle RPCs ---------------------------------------------
CREATE OR REPLACE FUNCTION public.request_friend(target_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF target_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot friend yourself';
  END IF;

  -- Either side blocked? Refuse without leaking who blocked whom — the UI
  -- already filters blocked users out of search, so this is a guard rail.
  IF EXISTS (
    SELECT 1 FROM public.friendships
     WHERE ((user_id = auth.uid() AND friend_id = target_id) OR
            (user_id = target_id  AND friend_id = auth.uid()))
       AND status = 'blocked'
  ) THEN
    RAISE EXCEPTION 'Cannot send request to this user';
  END IF;

  INSERT INTO public.friendships (user_id, friend_id, status, requested_by)
  VALUES (auth.uid(), target_id, 'pending', auth.uid())
  ON CONFLICT (user_id, friend_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_friend(requester_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.friendships
     SET status = 'accepted'
   WHERE user_id = auth.uid()
     AND friend_id = requester_id
     AND status = 'pending'
     AND requested_by = requester_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.block_user(target_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF target_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot block yourself';
  END IF;

  -- Upsert blocked state on the caller's side. The mirror trigger then
  -- propagates the block to the other side, satisfying the bidirectional
  -- semantics: neither party can become friends or surface in search.
  INSERT INTO public.friendships (user_id, friend_id, status, requested_by)
  VALUES (auth.uid(), target_id, 'blocked', auth.uid())
  ON CONFLICT (user_id, friend_id) DO UPDATE
     SET status = 'blocked',
         requested_by = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_friendship_record(target_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  DELETE FROM public.friendships
   WHERE user_id = auth.uid() AND friend_id = target_id;
END;
$$;

-- 7. Read RPCs --------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_friends()
RETURNS TABLE (id UUID, display_name TEXT, is_artist BOOLEAN)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.display_name, p.is_artist
  FROM public.friendships f
  JOIN public.profiles    p ON p.id = f.friend_id
  WHERE f.user_id = auth.uid() AND f.status = 'accepted'
  ORDER BY p.display_name NULLS LAST, p.id;
$$;

-- Pending requests RECEIVED by the caller. Owing to mirroring the rule is
-- "my row, status=pending, and requested_by is the other party" (otherwise
-- it's something I sent).
CREATE OR REPLACE FUNCTION public.get_pending_friend_requests()
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  is_artist BOOLEAN,
  requested_at TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.display_name, p.is_artist, f.created_at
  FROM public.friendships f
  JOIN public.profiles    p ON p.id = f.friend_id
  WHERE f.user_id = auth.uid()
    AND f.status = 'pending'
    AND f.requested_by = f.friend_id
  ORDER BY f.created_at DESC;
$$;

-- Mutual friends with a target user.
CREATE OR REPLACE FUNCTION public.get_mutual_friends(other_user_id UUID)
RETURNS TABLE (id UUID, display_name TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.display_name
  FROM public.friendships f1
  JOIN public.friendships f2
    ON f1.friend_id = f2.friend_id AND f2.user_id = other_user_id
  JOIN public.profiles p ON p.id = f1.friend_id
  WHERE f1.user_id = auth.uid()
    AND f1.status = 'accepted'
    AND f2.status = 'accepted'
  ORDER BY p.display_name NULLS LAST, p.id;
$$;

-- Friends who marked "going" for a single event OR course (exactly one).
CREATE OR REPLACE FUNCTION public.get_friends_at_activity(
  p_event_id  UUID DEFAULT NULL,
  p_course_id UUID DEFAULT NULL
)
RETURNS TABLE (id UUID, display_name TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF (p_event_id IS NULL AND p_course_id IS NULL)
     OR (p_event_id IS NOT NULL AND p_course_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Pass exactly one of p_event_id or p_course_id';
  END IF;

  RETURN QUERY
    SELECT p.id, p.display_name
    FROM public.friendships f
    JOIN public.profiles    p ON p.id = f.friend_id
    JOIN public.registrations r ON r.user_id = f.friend_id
    WHERE f.user_id = auth.uid()
      AND f.status = 'accepted'
      AND (
        (p_event_id  IS NOT NULL AND r.event_id  = p_event_id) OR
        (p_course_id IS NOT NULL AND r.course_id = p_course_id)
      )
    ORDER BY p.display_name NULLS LAST, p.id;
END;
$$;

-- Friend discovery — narrow profile search excluding self, blocked
-- (either direction), and existing accepted friends. `pending` flags
-- existing outgoing requests so the UI can show "request sent".
CREATE OR REPLACE FUNCTION public.search_profiles_for_friends(
  query_text  TEXT    DEFAULT '',
  max_results INTEGER DEFAULT 7
)
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  is_artist BOOLEAN,
  pending BOOLEAN,
  venue_name TEXT,
  venue_logo_url TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    p.id,
    p.display_name,
    p.is_artist,
    EXISTS (
      SELECT 1 FROM public.friendships f
       WHERE f.user_id = auth.uid()
         AND f.friend_id = p.id
         AND f.status = 'pending'
    ) AS pending,
    v.name  AS venue_name,
    v.logo_url AS venue_logo_url
  FROM public.profiles p
  LEFT JOIN public.venues v ON v.owner_id = p.id
  WHERE p.id <> auth.uid()
    AND (query_text = ''
         OR COALESCE(p.display_name, '') ILIKE '%' || query_text || '%')
    AND NOT EXISTS (
      SELECT 1 FROM public.friendships b
       WHERE ((b.user_id = auth.uid() AND b.friend_id = p.id) OR
              (b.user_id = p.id       AND b.friend_id = auth.uid()))
         AND b.status IN ('blocked', 'accepted')
    )
  ORDER BY p.display_name NULLS LAST, p.id
  LIMIT GREATEST(1, LEAST(max_results, 50));
$$;

-- 8a. Friend request notification ------------------------------------------
-- When someone sends a friend request, notify the target user.
-- Only fires on the "original" INSERT (depth 1), not the mirror.
CREATE OR REPLACE FUNCTION public.notify_on_friend_request()
RETURNS TRIGGER AS $$
DECLARE
  requester_name TEXT;
BEGIN
  -- Only on the original insert (not the mirror), and only for pending requests.
  IF pg_trigger_depth() > 1 OR NEW.status <> 'pending' THEN
    RETURN NEW;
  END IF;

  -- Notify the OTHER user (friend_id), not the requester.
  SELECT display_name INTO requester_name
    FROM public.profiles WHERE id = NEW.requested_by;

  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    NEW.friend_id,
    'friend_request',
    'בקשת חברות חדשה',
    COALESCE(requester_name, 'משתמש/ת') || ' שלח/ה לך בקשת חברות',
    jsonb_build_object('requester_id', NEW.requested_by)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_on_friend_request
  AFTER INSERT ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_friend_request();

-- Notify the original requester when their friend request is accepted.
-- Only fires on the original UPDATE (not the mirror), pending → accepted.
CREATE OR REPLACE FUNCTION public.notify_on_friend_accepted()
RETURNS TRIGGER AS $$
DECLARE
  accepter_name TEXT;
BEGIN
  IF pg_trigger_depth() > 1 THEN RETURN NEW; END IF;
  IF OLD.status <> 'pending' OR NEW.status <> 'accepted' THEN RETURN NEW; END IF;

  -- The accepter is auth.uid() (the one who called accept_friend).
  -- Notify the original requester (requested_by).
  SELECT display_name INTO accepter_name
    FROM public.profiles WHERE id = NEW.friend_id;

  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    NEW.requested_by,
    'friend_accepted',
    'בקשת החברות אושרה',
    COALESCE(accepter_name, 'משתמש/ת') || ' אישר/ה את בקשת החברות שלך',
    jsonb_build_object('friend_id', NEW.friend_id)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_on_friend_accepted
  AFTER UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_friend_accepted();

-- 8b. Friends-going notifications ------------------------------------------
-- Inserts one notification per accepted friend on registrations INSERT,
-- deduped per (friend, activity) within a 24h window so toggle-spam can't
-- flood the inbox. The notification carries `registration_id` in its data
-- payload so the AFTER DELETE trigger below can clean up if the friend
-- un-marks.
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

  body_text := COALESCE(actor_name, 'חבר/ה')
            || ' מתכוון/ת להגיע ל"'
            || COALESCE(activity_title, '')
            || '"';

  INSERT INTO public.notifications (user_id, type, title, body, data)
  SELECT
    f.user_id,
    notif_type,
    'חבר/ה מצטרפ/ת',
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

CREATE TRIGGER trigger_notify_friends_on_going
  AFTER INSERT ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.notify_friends_on_going();

-- Auto-clear "friend going" notifications when the friend un-marks. We
-- match by the registration_id stored in `data` on the notification row.
CREATE OR REPLACE FUNCTION public.clear_going_notifications()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.notifications
   WHERE type IN ('friend_going_event', 'friend_going_course')
     AND (data->>'registration_id')::uuid = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_clear_going_notifications
  AFTER DELETE ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.clear_going_notifications();

-- 9. Event date change → notify everyone with a registration. -------------
CREATE OR REPLACE FUNCTION public.notify_registrants_on_event_date_change()
RETURNS TRIGGER AS $$
DECLARE
  body_text TEXT;
BEGIN
  IF OLD.date IS NOT DISTINCT FROM NEW.date THEN
    RETURN NEW;
  END IF;

  body_text := 'התאריך של "' || COALESCE(NEW.title, '')
            || '" השתנה ל-' || NEW.date::text;

  INSERT INTO public.notifications (user_id, type, title, body, data)
  SELECT
    r.user_id,
    'event_date_changed',
    'תאריך אירוע השתנה',
    body_text,
    jsonb_build_object(
      'event_id', NEW.id,
      'old_date', OLD.date,
      'new_date', NEW.date
    )
  FROM public.registrations r
  WHERE r.event_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_event_date_change
  AFTER UPDATE OF date ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.notify_registrants_on_event_date_change();

-- 10. Grants ---------------------------------------------------------------
-- Match migration 018: REVOKE ALL FROM public, then GRANT EXECUTE TO
-- authenticated. Anonymous role gets nothing.
REVOKE ALL ON FUNCTION public.request_friend(UUID)                       FROM public;
REVOKE ALL ON FUNCTION public.accept_friend(UUID)                        FROM public;
REVOKE ALL ON FUNCTION public.block_user(UUID)                           FROM public;
REVOKE ALL ON FUNCTION public.remove_friendship_record(UUID)             FROM public;
REVOKE ALL ON FUNCTION public.get_my_friends()                           FROM public;
REVOKE ALL ON FUNCTION public.get_pending_friend_requests()              FROM public;
REVOKE ALL ON FUNCTION public.get_mutual_friends(UUID)                   FROM public;
REVOKE ALL ON FUNCTION public.get_friends_at_activity(UUID, UUID)        FROM public;
REVOKE ALL ON FUNCTION public.search_profiles_for_friends(TEXT, INTEGER) FROM public;

GRANT EXECUTE ON FUNCTION public.request_friend(UUID)                       TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_friend(UUID)                        TO authenticated;
GRANT EXECUTE ON FUNCTION public.block_user(UUID)                           TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_friendship_record(UUID)             TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_friends()                           TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_friend_requests()              TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_mutual_friends(UUID)                   TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_friends_at_activity(UUID, UUID)        TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_profiles_for_friends(TEXT, INTEGER) TO authenticated;
