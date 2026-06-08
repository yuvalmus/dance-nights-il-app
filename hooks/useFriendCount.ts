import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { cachedFetch, invalidate, TTL } from '@/lib/cache';

const CACHE_KEY = 'friend-count';

export function useFriendCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCount(0);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const n = await cachedFetch(CACHE_KEY, TTL.FRIENDS, async () => {
          // Head-only count — no rows transferred, just the integer.
          const { count: total, error } = await supabase
            .from('friendships')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'accepted');
          if (error) throw error;
          return total ?? 0;
        });
        if (!cancelled) setCount(n);
      } catch (err) {
        console.error('useFriendCount:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  const refresh = () => {
    invalidate(CACHE_KEY);
  };

  return { count, loading, refresh };
}
