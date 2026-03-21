import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database';
import { useAuth } from '@/lib/auth';
import { cachedFetch, invalidate, TTL } from '@/lib/cache';

// Only fields the UI needs — excludes expo_push_token, favorite_venues, timestamps
const PROFILE_SELECT = 'id, display_name, dance_level, dance_styles';

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const cacheKey = user ? `profile:${user.id}` : '';

  const fetchProfile = useCallback(async () => {
    if (!user) { setProfile(null); setLoading(false); return; }

    try {
      setLoading(true);

      const data = await cachedFetch(cacheKey, TTL.PROFILE, async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select(PROFILE_SELECT)
          .eq('id', user.id)
          .single();

        if (error) throw error;
        return data as Profile;
      });

      setProfile(data);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  }, [cacheKey]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
      invalidate(cacheKey);
      await fetchProfile();
    },
    [user, cacheKey, fetchProfile],
  );

  return { profile, loading, updateProfile, refetch: fetchProfile };
}
