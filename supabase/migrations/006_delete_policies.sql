-- Add missing DELETE policies for venue owners

CREATE POLICY "Venue owner deletes schedules" ON event_schedules
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM events e
    JOIN venues v ON v.id = e.venue_id
    WHERE e.id = event_id AND v.owner_id = auth.uid()
  )
);

CREATE POLICY "Venue owner deletes events" ON events
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM venues WHERE id = venue_id AND owner_id = auth.uid()
  )
);
