-- Add registration_links JSONB column (array of {label, url, spots_total, spots_taken})
ALTER TABLE events ADD COLUMN registration_links JSONB DEFAULT '[]';

-- Migrate existing single-link events into the new array format
UPDATE events
SET registration_links = jsonb_build_array(
  jsonb_build_object(
    'label', 'הרשמה',
    'url', registration_link,
    'spots_total', spots_total,
    'spots_taken', spots_taken
  )
)
WHERE registration_link IS NOT NULL AND registration_link != '';

-- Drop old columns
ALTER TABLE events DROP COLUMN registration_link;
ALTER TABLE events DROP COLUMN spots_total;
ALTER TABLE events DROP COLUMN spots_taken;

-- Recreate RPC with registration_links instead of the 3 old columns
DROP FUNCTION IF EXISTS get_events_by_date_and_distance(DATE, DOUBLE PRECISION, DOUBLE PRECISION);
CREATE OR REPLACE FUNCTION get_events_by_date_and_distance(
  target_date DATE,
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION
) RETURNS TABLE (
  event_id UUID, date DATE, title TEXT, description TEXT,
  dance_styles TEXT[], poster_url TEXT, price INTEGER,
  price_note TEXT, dj TEXT, pre_register BOOLEAN,
  registration_links JSONB,
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
  e.registration_links,
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
