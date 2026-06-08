-- 023: Notifications v2 — schema additions, single-writer helpers, feed RPC.
--
-- The v1 table (017) was a flat insert-many-rows model: every friend-going
-- event produced N rows in N inboxes. v2 keeps the same table but adds:
--
--   * `group_key` — opt-in dedup/aggregation key, UNIQUE per user. The single
--     `upsert_notification()` writer below merges into an existing row when
--     the same (user_id, group_key) recurs.
--
--   * `sort_at` — used for inbox ordering. Defaults to created_at on insert,
--     bumps to now() whenever a grouped row gets new content (a new actor
--     joined "friends going", a course got re-submitted, etc.). The inbox
--     sorts by sort_at DESC so updated cards bubble back to the top.
--
--   * `push_eligible` — whether the row should fan out to the push pipeline.
--     The Edge Function reads this flag; debouncing lives there (`last_push_at`).
--
--   * `updated_at` / `last_push_at` — bookkeeping for the merge logic + the
--     push debouncer.
--
-- The next migration (025) drops the v1 triggers and rebuilds them on top of
-- `upsert_notification()`. This file is responsible only for the *primitives*
-- those triggers consume.

-- 1. Schema additions ------------------------------------------------------

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS group_key     TEXT,
  ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS sort_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS push_eligible BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_push_at  TIMESTAMPTZ;

-- One row per (user, group_key) — the dedup contract.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_notifications_user_group
  ON public.notifications (user_id, group_key)
  WHERE group_key IS NOT NULL;

-- Feed-ordering index — matches the cursor used by get_notification_feed.
CREATE INDEX IF NOT EXISTS idx_notifications_user_sort
  ON public.notifications (user_id, sort_at DESC, id DESC);

-- Backfill sort_at/updated_at on pre-existing rows so they show up in feed order.
UPDATE public.notifications
   SET sort_at = created_at,
       updated_at = created_at
 WHERE sort_at = updated_at AND sort_at <> created_at;

-- 2. Per-user notification preferences ------------------------------------
--
-- Stored on `profiles` as a single JSONB column. Buckets match the categories
-- shown in the profile UI; the push Edge Function reads this before fanning
-- out. In-app inbox always receives the row regardless — the toggle only
-- mutes the device push.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB NOT NULL DEFAULT
    jsonb_build_object(
      'social',          true,
      'friend_requests', true,
      'management',      true,
      'event_updates',   true,
      'favorites',       true,
      'reminders',       true
    );

-- 3. Hebrew copy builders --------------------------------------------------
--
-- Bodies are computed inside the DB (SQL must own the final string per the
-- plan). Mirrors the friendsCaption logic on the client: 1 / 2 / 3+ forms.

CREATE OR REPLACE FUNCTION public.build_friends_going_body(p_data JSONB)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  v_actors      JSONB   := COALESCE(p_data->'actors', '[]'::jsonb);
  v_count       INTEGER := jsonb_array_length(v_actors);
  v_title       TEXT    := COALESCE(p_data->>'activity_title', '');
  v_first       TEXT;
  v_second      TEXT;
BEGIN
  IF v_count = 0 THEN
    RETURN '';
  END IF;

  v_first := COALESCE(v_actors->0->>'display_name', 'חבר');

  IF v_count = 1 THEN
    RETURN v_first || ' מגיע ל«' || v_title || '» — הצטרף גם!';
  END IF;

  v_second := COALESCE(v_actors->1->>'display_name', 'חבר');

  IF v_count = 2 THEN
    RETURN v_first || ' ו' || v_second
           || ' מגיעים ל«' || v_title || '» — הצטרף גם!';
  END IF;

  RETURN v_first || ', ' || v_second
         || ' ועוד ' || (v_count - 2)::text
         || ' חברים מגיעים ל«' || v_title || '» — הצטרף גם!';
END;
$$;

-- Append/refresh an actor in data.actors[]. Returns the new data payload.
-- Used by the friends-going trigger when an additional friend joins.
CREATE OR REPLACE FUNCTION public.merge_friend_actor(
  p_data       JSONB,
  p_actor_id   UUID,
  p_actor_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  v_actors  JSONB := COALESCE(p_data->'actors', '[]'::jsonb);
  v_new     JSONB := '[]'::jsonb;
  v_entry   JSONB;
  v_found   BOOLEAN := false;
  v_now_iso TEXT := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');
BEGIN
  FOR v_entry IN SELECT jsonb_array_elements(v_actors) LOOP
    IF (v_entry->>'id')::uuid = p_actor_id THEN
      v_new   := v_new || jsonb_build_array(
                    jsonb_build_object(
                      'id',           p_actor_id,
                      'display_name', p_actor_name,
                      'at',           v_now_iso
                    ));
      v_found := true;
    ELSE
      v_new := v_new || jsonb_build_array(v_entry);
    END IF;
  END LOOP;

  IF NOT v_found THEN
    v_new := v_new || jsonb_build_array(
                jsonb_build_object(
                  'id',           p_actor_id,
                  'display_name', p_actor_name,
                  'at',           v_now_iso
                ));
  END IF;

  RETURN p_data || jsonb_build_object('actors', v_new);
END;
$$;

-- 4. Single-writer upsert + insert-once helpers ----------------------------
--
-- Every trigger goes through these two helpers. Direct INSERTs from triggers
-- are forbidden by convention — keeps the lifecycle (sort_at bump, read_at
-- reset on new content, push_eligible re-arming) consistent across types.

CREATE OR REPLACE FUNCTION public.upsert_notification(
  p_user_id        UUID,
  p_type           TEXT,
  p_title          TEXT,
  p_body           TEXT,
  p_data           JSONB,
  p_group_key      TEXT    DEFAULT NULL,
  p_push_eligible  BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  -- No group_key → plain insert (legacy / non-aggregated types).
  IF p_group_key IS NULL THEN
    INSERT INTO public.notifications
      (user_id, type, title, body, data, group_key, push_eligible)
    VALUES
      (p_user_id, p_type, p_title, p_body, p_data, NULL, p_push_eligible)
    RETURNING id INTO v_id;
    RETURN v_id;
  END IF;

  INSERT INTO public.notifications
    (user_id, type, title, body, data, group_key, push_eligible)
  VALUES
    (p_user_id, p_type, p_title, p_body, p_data, p_group_key, p_push_eligible)
  ON CONFLICT (user_id, group_key) DO UPDATE
     SET type          = EXCLUDED.type,
         title         = EXCLUDED.title,
         body          = EXCLUDED.body,
         data          = EXCLUDED.data,
         updated_at    = now(),
         sort_at       = now(),
         -- A new actor / new content makes the card "fresh" again. Callers
         -- that want to preserve read state should use insert_notification_once.
         read_at       = NULL,
         push_eligible = EXCLUDED.push_eligible OR public.notifications.push_eligible
   RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Insert exactly once per (user, group_key). Subsequent calls become no-ops.
-- Used for "set-and-forget" notifications like spots-running-low where we
-- explicitly DO NOT want re-firing to bump the row back to unread.
CREATE OR REPLACE FUNCTION public.insert_notification_once(
  p_user_id        UUID,
  p_type           TEXT,
  p_title          TEXT,
  p_body           TEXT,
  p_data           JSONB,
  p_group_key      TEXT,
  p_push_eligible  BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.notifications
    (user_id, type, title, body, data, group_key, push_eligible)
  VALUES
    (p_user_id, p_type, p_title, p_body, p_data, p_group_key, p_push_eligible)
  ON CONFLICT (user_id, group_key) DO NOTHING
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 5. Feed RPC — cursor pagination -----------------------------------------
--
-- One round-trip per page. The cursor is (sort_at, id) for stable ordering
-- when many rows share the same sort_at. `unread_count` is the *total* across
-- the whole inbox (for the floating-button badge), not just this page; the
-- floating button can call this with limit=1 to refresh the badge cheaply.

CREATE OR REPLACE FUNCTION public.get_notification_feed(
  p_cursor_sort_at TIMESTAMPTZ DEFAULT NULL,
  p_cursor_id      UUID        DEFAULT NULL,
  p_limit          INTEGER     DEFAULT 20
)
RETURNS TABLE (
  id            UUID,
  type          TEXT,
  title         TEXT,
  body          TEXT,
  data          JSONB,
  group_key     TEXT,
  read_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ,
  sort_at       TIMESTAMPTZ,
  unread_count  BIGINT,
  has_more      BOOLEAN
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_limit        INTEGER := GREATEST(1, LEAST(p_limit, 50));
  v_total_unread BIGINT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  SELECT count(*) INTO v_total_unread
    FROM public.notifications n
   WHERE n.user_id = auth.uid()
     AND n.read_at IS NULL;

  RETURN QUERY
  WITH page AS (
    SELECT n.id, n.type, n.title, n.body, n.data, n.group_key,
           n.read_at, n.created_at, n.updated_at, n.sort_at
      FROM public.notifications n
     WHERE n.user_id = auth.uid()
       AND (
         p_cursor_sort_at IS NULL
         OR  n.sort_at <  p_cursor_sort_at
         OR (n.sort_at =  p_cursor_sort_at AND n.id < p_cursor_id)
       )
     ORDER BY n.sort_at DESC, n.id DESC
     LIMIT v_limit + 1
  ),
  page_capped AS (
    SELECT * FROM page LIMIT v_limit
  )
  SELECT pc.id, pc.type, pc.title, pc.body, pc.data, pc.group_key,
         pc.read_at, pc.created_at, pc.updated_at, pc.sort_at,
         v_total_unread,
         (SELECT count(*) FROM page) > v_limit
    FROM page_capped pc;
END;
$$;

-- Compact unread-count probe for the floating-button badge. Keeps the
-- expensive feed query off the cold-start path of the Dance tab.
CREATE OR REPLACE FUNCTION public.get_notification_unread_count()
RETURNS INTEGER
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(count(*)::int, 0)
    FROM public.notifications
   WHERE user_id = auth.uid() AND read_at IS NULL;
$$;

-- 6. Drop the v1 triggers that 025 will rebuild on top of upsert_notification.
-- We drop them here so 025 stays focused on the new implementations and the
-- migration file boundary aligns with the conceptual rewrite.
DROP TRIGGER IF EXISTS notify_owner_on_instructor_leave ON public.venue_affiliations;
DROP TRIGGER IF EXISTS trigger_notify_on_friend_request   ON public.friendships;
DROP TRIGGER IF EXISTS trigger_notify_on_friend_accepted  ON public.friendships;
DROP TRIGGER IF EXISTS trigger_notify_friends_on_going    ON public.registrations;
DROP TRIGGER IF EXISTS trigger_clear_going_notifications  ON public.registrations;
DROP TRIGGER IF EXISTS trigger_notify_event_date_change   ON public.events;

-- 7. Grants ----------------------------------------------------------------
REVOKE ALL ON FUNCTION public.get_notification_feed(TIMESTAMPTZ, UUID, INTEGER) FROM public;
REVOKE ALL ON FUNCTION public.get_notification_unread_count()                   FROM public;

GRANT EXECUTE ON FUNCTION public.get_notification_feed(TIMESTAMPTZ, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_notification_unread_count()                   TO authenticated;
