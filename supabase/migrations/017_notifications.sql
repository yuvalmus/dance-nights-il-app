-- 017: Notifications — durable per-user notification feed
--
-- Generic bucket for important events in a user's life on the app. Phase 1
-- uses it for venue-owner "instructor left" events; future phases will fan
-- out (course approval submitted, invite accepted, event reminder, etc.).
--
-- Push delivery is NOT implemented here — `profiles.expo_push_token` exists,
-- and a later phase will wire an Edge Function to read this table and dispatch.

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread
  ON notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE INDEX idx_notifications_user_all
  ON notifications(user_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users read and mark their own notifications as read. Inserts happen only
-- via SECURITY DEFINER triggers or service role — never a direct client write.
CREATE POLICY "User reads own notifications" ON notifications
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "User updates own notifications" ON notifications
FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "User deletes own notifications" ON notifications
FOR DELETE USING (user_id = auth.uid());

-- Lock out direct INSERT from client roles. Triggers run as SECURITY DEFINER
-- so they aren't affected.
REVOKE INSERT ON notifications FROM authenticated;
REVOKE INSERT ON notifications FROM anon;

-- Notify venue owner when an instructor leaves (active → revoked). The plan
-- explicitly calls for this as the seed use case.
CREATE OR REPLACE FUNCTION notify_owner_on_instructor_leave() RETURNS TRIGGER AS $$
DECLARE
  venue_owner UUID;
  venue_name TEXT;
  instructor_name TEXT;
  is_self_leave BOOLEAN;
BEGIN
  -- Only fire on active → revoked transitions initiated by the instructor.
  -- Owner-initiated revokes shouldn't notify the owner of themselves.
  IF NOT (OLD.status = 'active' AND NEW.status = 'revoked') THEN
    RETURN NEW;
  END IF;

  is_self_leave := (auth.uid() = NEW.user_id);
  IF NOT is_self_leave THEN
    RETURN NEW;
  END IF;

  SELECT v.owner_id, v.name INTO venue_owner, venue_name
  FROM venues v WHERE v.id = NEW.venue_id;

  SELECT p.display_name INTO instructor_name
  FROM profiles p WHERE p.id = NEW.user_id;

  IF venue_owner IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    venue_owner,
    'instructor_left_venue',
    'מדריך עזב את המקום',
    COALESCE(instructor_name, 'מדריך') || ' עזב את ' || COALESCE(venue_name, 'המקום שלך'),
    jsonb_build_object(
      'venue_id', NEW.venue_id,
      'user_id', NEW.user_id,
      'affiliation_id', NEW.id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER notify_owner_on_instructor_leave
  AFTER UPDATE ON venue_affiliations
  FOR EACH ROW EXECUTE FUNCTION notify_owner_on_instructor_leave();
