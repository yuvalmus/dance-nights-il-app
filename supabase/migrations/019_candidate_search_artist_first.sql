-- 019: Profile-candidate search — push verified artists to the top.
--
-- The RPC backs instructor invites AND the course-form instructor picker,
-- where listing artists first is the natural UX. The old ordering sorted by
-- display_name only, so artists risked falling past the LIMIT on busy
-- queries. Ordering by is_artist DESC first keeps them in frame, then alpha.

CREATE OR REPLACE FUNCTION search_profiles_for_affiliation(
  query_text TEXT DEFAULT '',
  max_results INTEGER DEFAULT 7
)
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  is_artist BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.display_name, p.is_artist
  FROM profiles p
  WHERE p.id <> auth.uid()
    AND (
      query_text = ''
      OR COALESCE(p.display_name, '') ILIKE '%' || query_text || '%'
    )
  ORDER BY p.is_artist DESC, p.display_name NULLS LAST, p.id
  LIMIT GREATEST(1, LEAST(max_results, 50));
$$;
