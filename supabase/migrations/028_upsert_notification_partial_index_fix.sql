-- 028: upsert_notification — match the partial unique index in ON CONFLICT.
--
-- The (user_id, group_key) unique index from 023 is partial:
--   WHERE group_key IS NOT NULL.
--
-- Postgres requires that predicate to appear on the ON CONFLICT clause for
-- the planner to choose this index as the conflict target. Without it the
-- INSERT errors with 42P10. We never call this branch with a NULL group_key
-- (the function early-returns above), but the parser doesn't know that.
--
-- This migration replaces upsert_notification with the corrected ON CONFLICT
-- target. Nothing else changes.

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
  ON CONFLICT (user_id, group_key) WHERE group_key IS NOT NULL
  DO UPDATE
     SET type          = EXCLUDED.type,
         title         = EXCLUDED.title,
         body          = EXCLUDED.body,
         data          = EXCLUDED.data,
         updated_at    = now(),
         sort_at       = now(),
         read_at       = NULL,
         push_eligible = EXCLUDED.push_eligible OR public.notifications.push_eligible
   RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Same fix for insert_notification_once.
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
  ON CONFLICT (user_id, group_key) WHERE group_key IS NOT NULL
  DO NOTHING
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
