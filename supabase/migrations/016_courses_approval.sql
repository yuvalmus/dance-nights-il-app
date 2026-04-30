-- 016: Courses — creator-owned edits + venue-owner approval gate
--
-- Rules implemented here:
--   * Course creator (`created_by`) is the ONLY account that edits course
--     content rows — even the venue owner of the hosting venue cannot edit
--     an artist's course fields.
--   * When a course carries a `venue_id`, publishing is gated behind the
--     venue owner's approval. Public SELECT never surfaces unapproved rows.
--   * The venue owner's ONLY lever on a non-owned course is transitioning
--     `approval_status`. That happens via the `set_course_approval` RPC,
--     not direct UPDATE — keeps the column authority clean.
--
-- Approval values:
--   * 'not_required' — no venue_id, creator controls publish
--   * 'approved'     — venue owner approved, or creator IS venue owner
--   * 'pending_owner_review' — waiting for venue owner
--   * 'rejected'     — venue owner said no; creator may edit and re-submit

ALTER TABLE courses
  ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'not_required'
    CHECK (approval_status IN ('not_required','pending_owner_review','approved','rejected')),
  ADD COLUMN approved_by UUID REFERENCES auth.users(id),
  ADD COLUMN approved_at TIMESTAMPTZ;

CREATE INDEX idx_courses_approval ON courses(approval_status) WHERE approval_status <> 'approved';

-- Backfill existing rows: a course created by the hosting venue owner is
-- auto-approved; venue-less courses are 'not_required'; anything else (artist
-- at a venue) becomes 'pending_owner_review'.
UPDATE courses c
SET approval_status = CASE
  WHEN c.venue_id IS NULL THEN 'not_required'
  WHEN EXISTS (SELECT 1 FROM venues v WHERE v.id = c.venue_id AND v.owner_id = c.created_by)
    THEN 'approved'
  ELSE 'pending_owner_review'
END,
approved_by = CASE
  WHEN c.venue_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM venues v WHERE v.id = c.venue_id AND v.owner_id = c.created_by
  ) THEN c.created_by
  ELSE NULL
END,
approved_at = CASE
  WHEN c.venue_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM venues v WHERE v.id = c.venue_id AND v.owner_id = c.created_by
  ) THEN now()
  ELSE NULL
END;

-- Auto-set approval_status on INSERT based on venue ownership. The app never
-- sets approval columns directly — keeps the two flows (create vs approve)
-- cleanly separated.
CREATE OR REPLACE FUNCTION courses_set_approval_state() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.venue_id IS NULL THEN
    NEW.approval_status := 'not_required';
    NEW.approved_by := NULL;
    NEW.approved_at := NULL;
  ELSIF EXISTS (SELECT 1 FROM venues WHERE id = NEW.venue_id AND owner_id = NEW.created_by) THEN
    NEW.approval_status := 'approved';
    NEW.approved_by := NEW.created_by;
    NEW.approved_at := now();
  ELSE
    NEW.approval_status := 'pending_owner_review';
    NEW.approved_by := NULL;
    NEW.approved_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_course_approval_on_insert
  BEFORE INSERT ON courses
  FOR EACH ROW EXECUTE FUNCTION courses_set_approval_state();

-- Recompute approval whenever creator or hosting venue changes.
CREATE TRIGGER set_course_approval_on_update
  BEFORE UPDATE OF venue_id, created_by ON courses
  FOR EACH ROW EXECUTE FUNCTION courses_set_approval_state();

-- Lock the approval columns so generic UPDATE policies cannot tamper with
-- them. The dedicated RPC below is SECURITY DEFINER and bypasses this.
REVOKE UPDATE (approval_status, approved_by, approved_at) ON courses FROM authenticated;
REVOKE UPDATE (approval_status, approved_by, approved_at) ON courses FROM anon;

-- Replace old venue-owner-driven policies with creator-driven ones.
DROP POLICY IF EXISTS "Venue owner manages courses" ON courses;
DROP POLICY IF EXISTS "Venue owner updates courses" ON courses;
DROP POLICY IF EXISTS "Public read courses" ON courses;

-- Public SELECT: published AND (no venue or approved by the venue owner).
CREATE POLICY "Public read published approved courses" ON courses
FOR SELECT USING (
  is_published = true
  AND (venue_id IS NULL OR approval_status = 'approved')
);

-- Creator always sees their own rows regardless of publish/approval state.
CREATE POLICY "Creator reads own courses" ON courses
FOR SELECT USING (created_by = auth.uid());

-- Venue owner sees courses hosted at their venue, approved or not, for the
-- approval inbox UX.
CREATE POLICY "Venue owner reads hosted courses" ON courses
FOR SELECT USING (
  venue_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM venues WHERE id = venue_id AND owner_id = auth.uid())
);

-- INSERT: any authenticated user may create a course they authored. If they
-- attach a venue_id, the trigger puts the row into pending_owner_review (or
-- approved when they own the venue). The artist gate is enforced elsewhere
-- via a CHECK on the caller's profile (see below).
CREATE POLICY "Creator inserts course" ON courses
FOR INSERT WITH CHECK (
  created_by = auth.uid()
  AND (
    -- Venue owner creating a course at their own venue
    (venue_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM venues WHERE id = venue_id AND owner_id = auth.uid()
    ))
    -- Or a verified artist, with or without a venue_id
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_artist = true
    )
  )
);

-- UPDATE: creator edits their own content. Column privileges block writes to
-- approval columns; a dedicated RPC handles those.
CREATE POLICY "Creator updates own course" ON courses
FOR UPDATE USING (
  created_by = auth.uid()
  AND approval_status <> 'pending_owner_review'
) WITH CHECK (
  created_by = auth.uid()
);

-- DELETE: creator deletes their own course.
CREATE POLICY "Creator deletes own course" ON courses
FOR DELETE USING (created_by = auth.uid());

-- RPC: venue owner approves / rejects / re-opens a course at their venue.
-- SECURITY DEFINER so it may write to approval columns even though end-user
-- roles had UPDATE on those columns revoked.
CREATE OR REPLACE FUNCTION set_course_approval(
  target_course_id UUID,
  new_status TEXT
) RETURNS courses AS $$
DECLARE
  updated courses;
BEGIN
  IF new_status NOT IN ('approved','rejected','pending_owner_review') THEN
    RAISE EXCEPTION 'Invalid approval status: %', new_status;
  END IF;

  -- Caller must own the course's venue. A course without a venue has nothing
  -- to approve.
  IF NOT EXISTS (
    SELECT 1
    FROM courses c
    JOIN venues v ON v.id = c.venue_id
    WHERE c.id = target_course_id AND v.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to change approval for this course';
  END IF;

  UPDATE courses
  SET approval_status = new_status,
      approved_by = CASE WHEN new_status = 'approved' THEN auth.uid() ELSE NULL END,
      approved_at = CASE WHEN new_status = 'approved' THEN now() ELSE NULL END
  WHERE id = target_course_id
  RETURNING * INTO updated;

  RETURN updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION set_course_approval(UUID, TEXT) FROM public;
GRANT EXECUTE ON FUNCTION set_course_approval(UUID, TEXT) TO authenticated;

-- Keep the course_schedules policies aligned: creator (via course) manages
-- schedules, not the hosting venue owner. Drop the old venue-owner policies
-- and reinstall creator-based ones.
DROP POLICY IF EXISTS "Venue owner manages course schedules" ON course_schedules;
DROP POLICY IF EXISTS "Venue owner updates course schedules" ON course_schedules;
DROP POLICY IF EXISTS "Venue owner deletes course schedules" ON course_schedules;

CREATE POLICY "Course creator manages course schedules" ON course_schedules
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM courses WHERE id = course_id AND created_by = auth.uid())
);

CREATE POLICY "Course creator updates course schedules" ON course_schedules
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM courses WHERE id = course_id AND created_by = auth.uid())
);

CREATE POLICY "Course creator deletes course schedules" ON course_schedules
FOR DELETE USING (
  EXISTS (SELECT 1 FROM courses WHERE id = course_id AND created_by = auth.uid())
);
