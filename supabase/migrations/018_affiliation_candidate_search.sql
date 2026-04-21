-- 018: Safe user search for venue-owner instructor invites
--
-- Owners must be able to invite regular users (not only artists) as instructors.
-- Instead of opening broad SELECT on profiles, expose a narrow SECURITY DEFINER
-- RPC that returns only the fields needed by the invite UI.

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
  ORDER BY p.display_name NULLS LAST, p.id
  LIMIT GREATEST(1, LEAST(max_results, 50));
$$;

REVOKE ALL ON FUNCTION search_profiles_for_affiliation(TEXT, INTEGER) FROM public;
GRANT EXECUTE ON FUNCTION search_profiles_for_affiliation(TEXT, INTEGER) TO authenticated;
