-- 011: Course details content extensions
-- - Add description and session_date columns to course_schedules
-- - Add announcements and learning_outcomes text arrays to courses

-- Extend course_schedules with per-session metadata
ALTER TABLE course_schedules ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE course_schedules ADD COLUMN IF NOT EXISTS session_date DATE;

-- Index for date-ordered schedule lookups
CREATE INDEX IF NOT EXISTS idx_course_schedules_date ON course_schedules(course_id, session_date);

-- Simple text arrays on courses — no need for separate tables
ALTER TABLE courses ADD COLUMN IF NOT EXISTS announcements TEXT[] DEFAULT '{}';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS learning_outcomes TEXT[] DEFAULT '{}';
