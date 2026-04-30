/**
 * useCourseApprovalQueue — venue-owner inbox of courses awaiting approval.
 *
 * The owner sees every non-approved course at their venue (pending + rejected
 * history for re-opening). Approved courses are surfaced through the normal
 * public course queries, so they don't belong here.
 */

import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { cachedFetch, TTL } from '@/lib/cache';
import { Course } from '@/types/database';
import {
  approveCourse as approveCall,
  rejectCourse as rejectCall,
} from '@/lib/courseApprovalService';

// Minimal creator profile for the inbox card.
type CreatorProfile = {
  id: string;
  display_name: string | null;
  is_artist: boolean;
};

export type PendingCourse = Course & {
  profiles: CreatorProfile | null;
};

const CREATOR_SELECT = 'id, display_name, is_artist';

export function useCourseApprovalQueue(venueId: string | undefined) {
  const [items, setItems] = useState<PendingCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const cacheKey = venueId ? `course-approval:${venueId}` : '';

  const fetchItems = useCallback(async () => {
    if (!venueId) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await cachedFetch(cacheKey, TTL.COURSE_APPROVAL, async () => {
        // Two-step fetch — see useVenueAffiliations for the rationale.
        const { data: courses, error } = await supabase
          .from('courses')
          .select('*')
          .eq('venue_id', venueId)
          .in('approval_status', ['pending_owner_review', 'rejected'])
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (!courses || courses.length === 0) return [];

        const creatorIds = Array.from(
          new Set(courses.map((c) => c.created_by).filter((id): id is string => !!id)),
        );

        let byId = new Map<string, CreatorProfile>();
        if (creatorIds.length > 0) {
          const { data: profiles, error: pErr } = await supabase
            .from('profiles')
            .select(CREATOR_SELECT)
            .in('id', creatorIds);

          if (pErr) throw pErr;
          byId = new Map((profiles ?? []).map((p) => [p.id, p as CreatorProfile]));
        }

        return courses.map((c) => ({
          ...c,
          profiles: c.created_by ? byId.get(c.created_by) ?? null : null,
        })) as PendingCourse[];
      });
      setItems(data);
    } catch (err) {
      console.error('Error fetching course approval queue:', err);
    } finally {
      setLoading(false);
    }
  }, [venueId, cacheKey]);

  useFocusEffect(useCallback(() => { fetchItems(); }, [fetchItems]));

  const approve = useCallback(async (courseId: string) => {
    await approveCall(courseId);
    await fetchItems();
  }, [fetchItems]);

  const reject = useCallback(async (courseId: string) => {
    await rejectCall(courseId);
    await fetchItems();
  }, [fetchItems]);

  return {
    pending: items.filter((c) => c.approval_status === 'pending_owner_review'),
    rejected: items.filter((c) => c.approval_status === 'rejected'),
    loading,
    approve,
    reject,
    refetch: fetchItems,
  };
}
