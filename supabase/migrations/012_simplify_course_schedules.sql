-- 012: Remove redundant course schedule fields
-- - courses.dates is derivable from course_schedules.date
-- - course_schedules.day is derivable from course_schedules.date
-- - Rename session_date -> date and make it NOT NULL

-- Drop redundant dates array from courses
ALTER TABLE courses DROP COLUMN IF EXISTS dates;

-- Drop redundant day column from course_schedules
ALTER TABLE course_schedules DROP COLUMN IF EXISTS day;

-- Drop old index that referenced session_date
DROP INDEX IF EXISTS idx_course_schedules_date;

-- Rename session_date to date and enforce NOT NULL
ALTER TABLE course_schedules RENAME COLUMN session_date TO date;
ALTER TABLE course_schedules ALTER COLUMN date SET NOT NULL;

-- Recreate index with new column name
CREATE INDEX IF NOT EXISTS idx_course_schedules_date ON course_schedules(course_id, date);
