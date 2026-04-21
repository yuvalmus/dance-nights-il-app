-- 015: Verified-artist flag on profiles
--
-- `is_artist` is granted manually by the operator via the Supabase Dashboard /
-- service role. It must NOT be writable by end users, even though the existing
-- "Users update own profile" RLS policy grants general UPDATE on the row.
--
-- We enforce this with Postgres column-level privileges: REVOKE UPDATE on the
-- single column from the authenticated/anon roles. RLS still governs the row,
-- but the column grant blocks writes regardless of RLS outcome. The service
-- role bypasses both, so Dashboard edits continue to work.

ALTER TABLE profiles
  ADD COLUMN is_artist BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX idx_profiles_artist ON profiles(is_artist) WHERE is_artist = true;

-- Strip column-level UPDATE rights for end-user roles.
REVOKE UPDATE (is_artist) ON profiles FROM authenticated;
REVOKE UPDATE (is_artist) ON profiles FROM anon;

-- Allow everyone to read the flag — the app surfaces "artist" badges, filters
-- courses by verified artists, etc. No need to hide the fact.
CREATE POLICY "Public read artist flag" ON profiles
FOR SELECT USING (is_artist = true);
