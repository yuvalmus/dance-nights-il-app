/**
 * useNotificationPreferences — read + write the per-category push mute toggles
 * stored as `profiles.notification_preferences` JSONB.
 *
 * The in-app inbox always receives every row; this only controls whether the
 * push Edge Function fans the row out to the device. Defaults to all-on so
 * an unmigrated row (no JSONB yet) still surfaces every category.
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { invalidateByPrefix } from '@/lib/cache';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NotificationPreferenceKey,
  NotificationPreferences,
} from '@/types/database';

export function useNotificationPreferences() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES,
  );
  const [loading, setLoading] = useState(true);

  const fetchPrefs = useCallback(async () => {
    if (!user) {
      setPrefs(DEFAULT_NOTIFICATION_PREFERENCES);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      setPrefs({
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...(data?.notification_preferences ?? {}),
      });
    } catch (err) {
      console.error('useNotificationPreferences fetch:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPrefs();
  }, [fetchPrefs]);

  const setPreference = useCallback(
    async (key: NotificationPreferenceKey, value: boolean) => {
      if (!user) return;
      const next: NotificationPreferences = { ...prefs, [key]: value };
      setPrefs(next);
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ notification_preferences: next })
          .eq('id', user.id);
        if (error) throw error;
        invalidateByPrefix(`profile:${user.id}`);
      } catch (err) {
        console.error('useNotificationPreferences setPreference:', err);
        // Roll back on failure so the toggle reflects truth.
        setPrefs(prefs);
      }
    },
    [user, prefs],
  );

  return { prefs, loading, setPreference };
}
