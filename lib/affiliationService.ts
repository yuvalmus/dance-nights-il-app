/**
 * venue_affiliations mutation layer.
 *
 * RLS enforces authority — these helpers just centralise the Supabase calls
 * so hooks/components never reach for the table directly, and we have one
 * obvious place to extend (e.g. batched operations, push hooks, analytics).
 */

import { supabase } from '@/lib/supabase';
import { VenueAffiliation } from '@/types/database';
import { invalidateByPrefix } from '@/lib/cache';

type InviteParams = {
  venueId: string;
  userId: string;      // the invited instructor
  invitedBy: string;   // venue owner, typically auth.user.id
};

function clearAffiliationCaches() {
  // One broad sweep — every consumer of affiliation data reads through the
  // cache module, so a prefix invalidation keeps the app consistent without
  // leaking per-consumer cache keys into this layer.
  invalidateByPrefix('affiliations:');
  invalidateByPrefix('venue-affiliations:');
}

export async function inviteInstructor({
  venueId,
  userId,
  invitedBy,
}: InviteParams): Promise<VenueAffiliation> {
  const { data, error } = await supabase
    .from('venue_affiliations')
    .insert({
      venue_id: venueId,
      user_id: userId,
      invited_by: invitedBy,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  clearAffiliationCaches();
  return data as VenueAffiliation;
}

async function transitionStatus(
  affiliationId: string,
  status: VenueAffiliation['status'],
): Promise<void> {
  const { error } = await supabase
    .from('venue_affiliations')
    .update({ status })
    .eq('id', affiliationId);

  if (error) throw error;
  clearAffiliationCaches();
}

/** Instructor accepts a pending invite. */
export function acceptInvite(affiliationId: string) {
  return transitionStatus(affiliationId, 'active');
}

/**
 * Instructor declines a pending invite OR leaves an active affiliation.
 * The DB trigger fires `instructor_left_venue` notification to the owner
 * only on the active→revoked transition, so this single call covers both
 * cases correctly.
 */
export function revokeAffiliation(affiliationId: string) {
  return transitionStatus(affiliationId, 'revoked');
}
