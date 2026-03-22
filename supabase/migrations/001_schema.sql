-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Venues
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  parking_info TEXT,
  has_shelter BOOLEAN DEFAULT false,
  theme_color TEXT DEFAULT '#6b21a8',
  logo_url TEXT,
  instagram_url TEXT,
  booking_url TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_venues_location ON venues USING GIST(location);
CREATE INDEX idx_venues_city ON venues(city);

-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  dance_styles TEXT[] DEFAULT '{}',
  poster_url TEXT,
  price TEXT,
  price_note TEXT,
  dj TEXT,
  instructors TEXT[] DEFAULT '{}',
  pre_register BOOLEAN DEFAULT false,
  registration_link TEXT,
  spots_total INTEGER,
  spots_taken INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_venue ON events(venue_id);
CREATE INDEX idx_events_styles ON events USING GIN(dance_styles);

-- Event schedules
CREATE TABLE event_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  time TIME NOT NULL,
  description TEXT NOT NULL,
  level TEXT,
  sort_order INTEGER DEFAULT 0
);
CREATE INDEX idx_schedules_event ON event_schedules(event_id);

-- Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  dance_level TEXT DEFAULT 'beginner' CHECK (dance_level IN ('beginner','intermediate','master')),
  dance_styles TEXT[] DEFAULT '{}',
  favorite_venues UUID[] DEFAULT '{}',
  expo_push_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Polls
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  title TEXT DEFAULT 'איפה רוקדים הלילה?',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id),
  label TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  voted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

-- Courses
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('course','bootcamp','festival')),
  dance_styles TEXT[] DEFAULT '{}',
  level TEXT,
  instructor TEXT,
  schedule TEXT,
  weeks INTEGER,
  start_date DATE,
  end_date DATE,
  price TEXT,
  spots_total INTEGER,
  spots_taken INTEGER DEFAULT 0,
  poster_url TEXT,
  registration_url TEXT,
  is_published BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_courses_type ON courses(type);
CREATE INDEX idx_courses_styles ON courses USING GIN(dance_styles);
