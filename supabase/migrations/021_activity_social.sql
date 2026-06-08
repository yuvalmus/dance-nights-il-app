-- 021: Single-call social payload for an event/course detail view.
--
-- A detail screen needs three facts at once to render the social block:
--   * how many people are going (a number — for the "momentum" framing),
--   * whether the viewer is going (button state),
--   * which accepted friends are going (avatars + names).
--
-- Migration 020's `get_friends_at_activity` returned only the friend list,
-- which forced a second own-registration read. This RPC folds all three
-- facts into one SECURITY DEFINER call so a detail view costs a single
-- round-trip.
--
-- `total_going` is exposed only as a count, never as a list — no client
-- can enumerate non-friend attendees, matching the 020 privacy stance.

CREATE OR REPLACE FUNCTION public.get_activity_social(
  p_event_id  UUID DEFAULT NULL,
  p_course_id UUID DEFAULT NULL
)
RETURNS TABLE (
  total_going  INTEGER,
  viewer_going BOOLEAN,
  friends      JSONB
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF (p_event_id IS NULL AND p_course_id IS NULL)
     OR (p_event_id IS NOT NULL AND p_course_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Pass exactly one of p_event_id or p_course_id';
  END IF;

  RETURN QUERY
  SELECT
    -- Everyone going — count only, never the rows themselves.
    (
      SELECT count(*)::INTEGER
      FROM public.registrations r
      WHERE (p_event_id  IS NOT NULL AND r.event_id  = p_event_id)
         OR (p_course_id IS NOT NULL AND r.course_id = p_course_id)
    ),
    -- Viewer's own registration.
    EXISTS (
      SELECT 1
      FROM public.registrations r
      WHERE r.user_id = auth.uid()
        AND (
          (p_event_id  IS NOT NULL AND r.event_id  = p_event_id) OR
          (p_course_id IS NOT NULL AND r.course_id = p_course_id)
        )
    ),
    -- Accepted friends going — identifiable, since the viewer already
    -- knows these people. COALESCE so the client always gets an array.
    COALESCE((
      SELECT jsonb_agg(
               jsonb_build_object('id', p.id, 'display_name', p.display_name)
               ORDER BY p.display_name NULLS LAST, p.id
             )
      FROM public.friendships   f
      JOIN public.profiles      p ON p.id = f.friend_id
      JOIN public.registrations r ON r.user_id = f.friend_id
      WHERE f.user_id = auth.uid()
        AND f.status = 'accepted'
        AND (
          (p_event_id  IS NOT NULL AND r.event_id  = p_event_id) OR
          (p_course_id IS NOT NULL AND r.course_id = p_course_id)
        )
    ), '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.get_activity_social(UUID, UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.get_activity_social(UUID, UUID) TO authenticated;
