-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Updated_at auto-update
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_venues BEFORE UPDATE ON venues FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_events BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Get events by date sorted by distance from user
CREATE OR REPLACE FUNCTION get_events_by_date_and_distance(
  target_date DATE,
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION
) RETURNS TABLE (
  event_id UUID, title TEXT, description TEXT,
  dance_styles TEXT[], poster_url TEXT, price TEXT,
  price_note TEXT, dj TEXT, pre_register BOOLEAN,
  registration_link TEXT, spots_total INT, spots_taken INT,
  venue_name TEXT, address TEXT, city TEXT,
  venue_lat DOUBLE PRECISION, venue_lng DOUBLE PRECISION,
  parking_info TEXT, has_shelter BOOLEAN,
  theme_color TEXT, distance_meters DOUBLE PRECISION,
  schedules JSONB, instructors TEXT[]
) AS $$
SELECT
  e.id, e.title, e.description,
  e.dance_styles, e.poster_url, e.price,
  e.price_note, e.dj, e.pre_register,
  e.registration_link, e.spots_total, e.spots_taken,
  v.name, v.address, v.city,
  ST_Y(v.location::geometry),
  ST_X(v.location::geometry),
  v.parking_info, v.has_shelter,
  v.theme_color,
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
