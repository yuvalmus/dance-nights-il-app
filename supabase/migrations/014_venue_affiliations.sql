-- 014: venue_affiliations — owner-invited instructors, user confirms, leaves instantly
--
-- Flow:
--   * Owner inserts row with status='pending' (invite)
--   * Invited user updates status to 'active' (accept) or 'revoked' (decline)
--   * Active user updates status to 'revoked' at any time (leave) — no owner approval
--   * Owner may update status to 'revoked' on pending rows (rescind invite) or on active rows (remove)
--
-- A separate trigger (see 017_notifications) creates a notification for the
-- venue owner when an instructor transitions away from 'active'.

CREATE TABLE venue_affiliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending','active','revoked')),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_venue_affiliations_venue ON venue_affiliations(venue_id);
CREATE INDEX idx_venue_affiliations_user ON venue_affiliations(user_id);
CREATE INDEX idx_venue_affiliations_status ON venue_affiliations(status);

-- Only one live row (pending or active) per (venue, user) at a time.
-- Revoked rows remain for history and can be re-invited by creating a new row.
CREATE UNIQUE INDEX idx_venue_affiliations_live_unique
  ON venue_affiliations(venue_id, user_id)
  WHERE status IN ('pending','active');

CREATE TRIGGER set_updated_at_venue_affiliations
  BEFORE UPDATE ON venue_affiliations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Stamp responded_at / revoked_at automatically on status transitions so the
-- application layer never has to pass timestamps.
CREATE OR REPLACE FUNCTION stamp_affiliation_status_timestamps() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status = 'pending' AND NEW.status IN ('active','revoked') THEN
      NEW.responded_at := now();
    END IF;
    IF NEW.status = 'revoked' THEN
      NEW.revoked_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stamp_venue_affiliations_timestamps
  BEFORE UPDATE ON venue_affiliations
  FOR EACH ROW EXECUTE FUNCTION stamp_affiliation_status_timestamps();

ALTER TABLE venue_affiliations ENABLE ROW LEVEL SECURITY;

-- SELECT: public reads active rows (for venue rosters / future venue profile
-- pages). Venue owner and the invited user see every status of their rows.
CREATE POLICY "Public read active affiliations" ON venue_affiliations
FOR SELECT USING (status = 'active');

CREATE POLICY "Owner reads venue affiliations" ON venue_affiliations
FOR SELECT USING (
  EXISTS (SELECT 1 FROM venues WHERE id = venue_id AND owner_id = auth.uid())
);

CREATE POLICY "User reads own affiliations" ON venue_affiliations
FOR SELECT USING (user_id = auth.uid());

-- INSERT: only the venue owner may create an invite, status must be 'pending',
-- and they record themselves as the inviter.
CREATE POLICY "Owner invites instructor" ON venue_affiliations
FOR INSERT WITH CHECK (
  status = 'pending'
  AND invited_by = auth.uid()
  AND EXISTS (SELECT 1 FROM venues WHERE id = venue_id AND owner_id = auth.uid())
);

-- UPDATE: invited user may respond to their own pending row (pending → active
-- or pending → revoked) and leave an active row (active → revoked). Owner may
-- rescind a pending invite or remove an active instructor (→ revoked).
CREATE POLICY "User responds to own invite" ON venue_affiliations
FOR UPDATE USING (
  user_id = auth.uid() AND status IN ('pending','active')
) WITH CHECK (
  user_id = auth.uid()
  AND status IN ('active','revoked')
);

CREATE POLICY "Owner revokes affiliation" ON venue_affiliations
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM venues WHERE id = venue_id AND owner_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM venues WHERE id = venue_id AND owner_id = auth.uid())
);

-- DELETE not exposed to clients — we keep revoked rows for audit history.
