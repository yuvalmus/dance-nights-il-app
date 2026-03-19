-- VENUES
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read venues" ON venues FOR SELECT USING (is_active = true);
CREATE POLICY "Owner manages venue" ON venues FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- EVENTS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read events" ON events FOR SELECT USING (is_published = true);
CREATE POLICY "Venue owner manages events" ON events FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM venues WHERE id = venue_id AND owner_id = auth.uid()));
CREATE POLICY "Venue owner updates events" ON events FOR UPDATE USING (EXISTS (SELECT 1 FROM venues WHERE id = venue_id AND owner_id = auth.uid()));

-- EVENT_SCHEDULES
ALTER TABLE event_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read schedules" ON event_schedules FOR SELECT USING (true);
CREATE POLICY "Venue owner manages schedules" ON event_schedules FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM events e JOIN venues v ON v.id = e.venue_id WHERE e.id = event_id AND v.owner_id = auth.uid()));
CREATE POLICY "Venue owner updates schedules" ON event_schedules FOR UPDATE USING (EXISTS (SELECT 1 FROM events e JOIN venues v ON v.id = e.venue_id WHERE e.id = event_id AND v.owner_id = auth.uid()));

-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- POLLS
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read polls" ON polls FOR SELECT USING (true);

-- POLL_OPTIONS
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read poll options" ON poll_options FOR SELECT USING (true);

-- POLL_VOTES
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read votes" ON poll_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users vote" ON poll_votes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- COURSES
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read courses" ON courses FOR SELECT USING (is_published = true);
CREATE POLICY "Venue owner manages courses" ON courses FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM venues WHERE id = venue_id AND owner_id = auth.uid()));
CREATE POLICY "Venue owner updates courses" ON courses FOR UPDATE USING (EXISTS (SELECT 1 FROM venues WHERE id = venue_id AND owner_id = auth.uid()));

-- STORAGE
INSERT INTO storage.buckets (id, name, public) VALUES ('posters', 'posters', true);
CREATE POLICY "Public poster access" ON storage.objects FOR SELECT USING (bucket_id = 'posters');
CREATE POLICY "Authenticated users upload posters" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'posters' AND auth.uid() IS NOT NULL);
