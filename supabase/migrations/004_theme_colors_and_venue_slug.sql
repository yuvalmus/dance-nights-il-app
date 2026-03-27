-- ============================================================
-- Migration: theme_color → theme_colors (TEXT[]) + add venue_slug to RPC
-- ============================================================

-- 1. Convert venues.theme_color from TEXT to TEXT[] (theme_colors)
--    Existing single colors are wrapped into a one-element array.
ALTER TABLE venues ADD COLUMN theme_colors TEXT[] DEFAULT ARRAY['#d4a017'];

UPDATE venues SET theme_colors = ARRAY[theme_color] WHERE theme_color IS NOT NULL;
UPDATE venues SET theme_colors = ARRAY['#d4a017'] WHERE theme_color IS NULL;

ALTER TABLE venues DROP COLUMN theme_color;

-- 2. Recreate the RPC to return theme_colors (TEXT[]) + venue_slug + date
DROP FUNCTION IF EXISTS get_events_by_date_and_distance(DATE, DOUBLE PRECISION, DOUBLE PRECISION);
CREATE OR REPLACE FUNCTION get_events_by_date_and_distance(
  target_date DATE,
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION
) RETURNS TABLE (
  event_id UUID, date DATE, title TEXT, description TEXT,
  dance_styles TEXT[], poster_url TEXT, price TEXT,
  price_note TEXT, dj TEXT, pre_register BOOLEAN,
  registration_link TEXT, spots_total INT, spots_taken INT,
  venue_name TEXT, venue_slug TEXT, address TEXT, city TEXT,
  venue_lat DOUBLE PRECISION, venue_lng DOUBLE PRECISION,
  parking_info TEXT, has_shelter BOOLEAN,
  theme_colors TEXT[], distance_meters DOUBLE PRECISION,
  schedules JSONB, instructors TEXT[]
) AS $$
SELECT
  e.id, e.date, e.title, e.description,
  e.dance_styles, e.poster_url, e.price,
  e.price_note, e.dj, e.pre_register,
  e.registration_link, e.spots_total, e.spots_taken,
  v.name, v.slug, v.address, v.city,
  ST_Y(v.location::geometry),
  ST_X(v.location::geometry),
  v.parking_info, v.has_shelter,
  v.theme_colors,
  ST_Distance(v.location, ST_MakePoint(user_lng, user_lat)::geography) AS distance_meters,
  (
    SELECT jsonb_agg(jsonb_build_object(
      'time', s.time, 'description', s.description, 'level', s.level
    ) ORDER BY s.sort_order)
    FROM event_schedules s WHERE s.event_id = e.id
  ),
  e.instructors
FROM events e
JOIN venues v ON v.id = e.venue_id
WHERE e.date = target_date AND e.is_published = true
ORDER BY distance_meters ASC;
$$ LANGUAGE sql STABLE;
