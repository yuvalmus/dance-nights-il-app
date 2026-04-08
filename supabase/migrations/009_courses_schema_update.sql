-- 009: Courses schema update
-- - Replace start_date/end_date with dates array (specific calendar days)
-- - Drop weeks (inferred from dates length)
-- - Drop schedule (replaced by course_schedules table)
-- - Replace dance_styles text[] with dance_style text (free-text, not enum-constrained)
-- - Add instructor_id linking to profiles
-- - Create course_schedules table (mirrors event_schedules pattern with TIME columns)

-- Drop old columns
ALTER TABLE courses DROP COLUMN IF EXISTS start_date;
ALTER TABLE courses DROP COLUMN IF EXISTS end_date;
ALTER TABLE courses DROP COLUMN IF EXISTS weeks;
ALTER TABLE courses DROP COLUMN IF EXISTS schedule;
ALTER TABLE courses DROP COLUMN IF EXISTS dance_styles;

-- Drop the GIN index that referenced dance_styles
DROP INDEX IF EXISTS idx_courses_styles;

-- Add new columns
ALTER TABLE courses ADD COLUMN dates DATE[] DEFAULT '{}';
ALTER TABLE courses ADD COLUMN dance_style TEXT;
ALTER TABLE courses ADD COLUMN instructor_id UUID REFERENCES profiles(id);

-- Course schedules — one row per weekday with real TIME columns
CREATE TABLE course_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  day TEXT NOT NULL CHECK (day IN ('sunday','monday','tuesday','wednesday','thursday','friday','saturday')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL
);
CREATE INDEX idx_course_schedules_course ON course_schedules(course_id);
