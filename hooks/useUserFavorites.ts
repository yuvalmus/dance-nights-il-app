/**
 * useUserFavorites — viewer's favourite venues/artists, with optimistic toggle.
 *
 * The hook stores membership as two Sets (venues + artists) so the UI's
 * "is this favourited?" check is O(1) without re-querying. `toggle` flips
 * locally first, then reconciles against the toggle_user_favorite RPC.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { cachedFetch, invalidate, TTL } from '@/lib/cache';
import { FavoriteTargetType } from '@/types/database';

type FavoritePair = { target_type: FavoriteTargetType; target_id: string };

export function useUserFavorites() {
  const { user } = useAuth();
  const [rows, setRows] = useState<FavoritePair[]>([]);
  const [loading, setLoading] = useState(true);

  const cacheKey = user ? `favorites:${user.id}` : '';

  const refetch = useCallback(async () => {
    if (!user) {
      setRows([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await cachedFetch(cacheKey, TTL.FRIENDS, async () => {
        const { data, error } = await supabase
          .from('user_favorites')
          .select('target_type, target_id')
          .eq('user_id', user.id);
        if (error) throw error;
        return (data ?? []) as FavoritePair[];
      });
      setRows(data);
    } catch (err) {
      console.error('useUserFavorites:', err);
    } finally {
      setLoading(false);
    }
  }, [user, cacheKey]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const venueIds = useMemo(
    () => new Set(rows.filter((r) => r.target_type === 'venue').map((r) => r.target_id)),
    [rows],
  );
  const artistIds = useMemo(
    () => new Set(rows.filter((r) => r.target_type === 'artist').map((r) => r.target_id)),
    [rows],
  );

  const isFavorite = useCallback(
    (targetType: FavoriteTargetType, targetId: string) =>
      targetType === 'venue' ? venueIds.has(targetId) : artistIds.has(targetId),
    [venueIds, artistIds],
  );

  const toggle = useCallback(
    async (targetType: FavoriteTargetType, targetId: string): Promise<boolean> => {
      if (!user) return false;

      const wasFavorite = isFavorite(targetType, targetId);
      const optimistic: FavoritePair[] = wasFavorite
        ? rows.filter((r) => !(r.target_type === targetType && r.target_id === targetId))
        : [...rows, { target_type: targetType, target_id: targetId }];

      setRows(optimistic);
      try {
        const { data, error } = await supabase.rpc('toggle_user_favorite', {
          p_target_type: targetType,
          p_target_id: targetId,
        });
        if (error) throw error;
        invalidate(cacheKey);
        return data === true;
      } catch (err) {
        console.error('useUserFavorites toggle:', err);
        setRows(rows);
        return wasFavorite;
      }
    },
    [user, rows, isFavorite, cacheKey],
  );

  return { venueIds, artistIds, isFavorite, toggle, loading, refetch };
}
