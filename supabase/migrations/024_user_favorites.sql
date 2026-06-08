-- 024: user_favorites — normalised favourites for venues and artists.
--
-- Replaces the `profiles.favorite_venues UUID[]` array from migration 001.
-- A row-per-favourite shape lets us:
--   * extend to a second target type (`artist`) without an additional column,
--   * place RLS on the rows directly,
--   * power notification triggers ("new published event at a venue I favourited")
--     with a simple JOIN instead of an array containment scan.
--
-- The notification triggers themselves live in 025; this file owns the
-- schema, the toggle RPC, and the one-time data migration from the array.

-- 1. Table ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('venue', 'artist')),
  target_id   UUID NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user
  ON public.user_favorites (user_id, target_type);

-- Targets are referenced by id only — venues and profiles (artists) live in
-- different tables, so no single FK works. Cleanup happens via the
-- corresponding source CASCADE (auth.users) and a defensive trigger below
-- that prunes orphans when the referenced row disappears.

-- 2. RLS --------------------------------------------------------------------
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fav: read own" ON public.user_favorites
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Fav: insert own" ON public.user_favorites
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Fav: delete own" ON public.user_favorites
  FOR DELETE USING (user_id = auth.uid());

-- 3. Toggle RPC -------------------------------------------------------------
--
-- Server-side toggle so the client can call once regardless of state.
-- Returns the *new* favourited state (true = now favourited).
CREATE OR REPLACE FUNCTION public.toggle_user_favorite(
  p_target_type TEXT,
  p_target_id   UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_existed BOOLEAN;
BEGIN
  IF p_target_type NOT IN ('venue', 'artist') THEN
    RAISE EXCEPTION 'Invalid favorite target_type: %', p_target_type;
  END IF;

  DELETE FROM public.user_favorites
    WHERE user_id     = auth.uid()
      AND target_type = p_target_type
      AND target_id   = p_target_id
  RETURNING true INTO v_existed;

  IF v_existed THEN
    RETURN false;
  END IF;

  INSERT INTO public.user_favorites (user_id, target_type, target_id)
  VALUES (auth.uid(), p_target_type, p_target_id);

  RETURN true;
END;
$$;

-- 4. Orphan cleanup --------------------------------------------------------
--
-- Drop favourites pointing at a vanished venue / artist. Cheap, runs only on
-- delete of the source, and keeps RLS simple by never having to consider
-- "is the target still alive".
CREATE OR REPLACE FUNCTION public.clear_favorites_on_target_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'venues' THEN
    DELETE FROM public.user_favorites
      WHERE target_type = 'venue' AND target_id = OLD.id;
  ELSIF TG_TABLE_NAME = 'profiles' THEN
    DELETE FROM public.user_favorites
      WHERE target_type = 'artist' AND target_id = OLD.id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_clear_favorites_on_venue_delete
  AFTER DELETE ON public.venues
  FOR EACH ROW EXECUTE FUNCTION public.clear_favorites_on_target_delete();

CREATE TRIGGER trigger_clear_favorites_on_profile_delete
  AFTER DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.clear_favorites_on_target_delete();

-- 5. Backfill from profiles.favorite_venues --------------------------------
--
-- One-time copy of the legacy array into the new table. Idempotent — re-runs
-- of the migration won't duplicate rows thanks to the UNIQUE constraint.
INSERT INTO public.user_favorites (user_id, target_type, target_id)
SELECT p.id, 'venue', v_id
  FROM public.profiles p,
       UNNEST(COALESCE(p.favorite_venues, ARRAY[]::UUID[])) AS v_id
 WHERE EXISTS (SELECT 1 FROM public.venues v WHERE v.id = v_id)
ON CONFLICT DO NOTHING;

-- Keep the old column around for one release as a safety net; later migration
-- can drop it once the app has been verified to read the new table only.

-- 6. Grants ----------------------------------------------------------------
REVOKE ALL ON FUNCTION public.toggle_user_favorite(TEXT, UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.toggle_user_favorite(TEXT, UUID) TO authenticated;
