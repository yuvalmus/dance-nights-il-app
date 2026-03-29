-- Venue owners need to read their own events regardless of publish status.
-- Without this, unpublished events are invisible to the owner (blocked by
-- the "Public read events" policy which requires is_published = true),
-- which also prevents UPDATE/DELETE operations on those rows.

CREATE POLICY "Venue owner reads own events" ON events
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM venues WHERE id = venue_id AND owner_id = auth.uid()
  )
);
