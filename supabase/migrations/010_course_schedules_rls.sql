-- 010: RLS policies for course_schedules (mirrors event_schedules pattern)

ALTER TABLE course_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read course schedules" ON course_schedules
FOR SELECT USING (true);

CREATE POLICY "Venue owner manages course schedules" ON course_schedules
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM courses c
    JOIN venues v ON v.id = c.venue_id
    WHERE c.id = course_id AND v.owner_id = auth.uid()
  )
);

CREATE POLICY "Venue owner updates course schedules" ON course_schedules
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM courses c
    JOIN venues v ON v.id = c.venue_id
    WHERE c.id = course_id AND v.owner_id = auth.uid()
  )
);

CREATE POLICY "Venue owner deletes course schedules" ON course_schedules
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM courses c
    JOIN venues v ON v.id = c.venue_id
    WHERE c.id = course_id AND v.owner_id = auth.uid()
  )
);
