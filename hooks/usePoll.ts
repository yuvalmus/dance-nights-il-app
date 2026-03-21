import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { PollWithOptions } from '@/types/database';
import { useAuth } from '@/lib/auth';
import { cachedFetch, invalidate, TTL } from '@/lib/cache';

export function usePoll(date: string) {
  const [poll, setPoll] = useState<PollWithOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [votingLoading, setVotingLoading] = useState(false);
  const { user } = useAuth();

  const cacheKey = `poll:${date}`;

  const fetchPoll = useCallback(async () => {
    try {
      setLoading(true);

      const data = await cachedFetch(cacheKey, TTL.POLL, async () => {
        const { data, error } = await supabase
          .from('polls')
          .select(`*, poll_options (id, label, sort_order, poll_votes ( count ))`)
          .eq('date', date)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data as PollWithOptions | null;
      });

      setPoll(data);

      // Check if current user has voted (lightweight, not cached)
      if (data && user) {
        const { data: voteData } = await supabase
          .from('poll_votes')
          .select('id')
          .eq('poll_id', data.id)
          .eq('user_id', user.id)
          .maybeSingle();

        setHasVoted(!!voteData);
      }
    } catch (err: any) {
      console.error('Error fetching poll:', err);
    } finally {
      setLoading(false);
    }
  }, [cacheKey, user]);

  useEffect(() => { fetchPoll(); }, [fetchPoll]);

  const vote = useCallback(
    async (optionId: string) => {
      if (!user || !poll) return;

      try {
        setVotingLoading(true);
        const { error } = await supabase.from('poll_votes').insert({
          poll_id: poll.id,
          option_id: optionId,
          user_id: user.id,
        });

        if (error) throw error;
        setHasVoted(true);
        invalidate(cacheKey); // Fresh counts after voting
        await fetchPoll();
      } catch (err: any) {
        console.error('Error voting:', err);
      } finally {
        setVotingLoading(false);
      }
    },
    [user, poll, cacheKey, fetchPoll],
  );

  const totalVotes = poll?.poll_options?.reduce(
    (sum, opt) => sum + (opt.poll_votes?.[0]?.count ?? 0),
    0,
  ) ?? 0;

  const refetch = useCallback(() => {
    invalidate(cacheKey);
    return fetchPoll();
  }, [cacheKey, fetchPoll]);

  return { poll, loading, hasVoted, vote, votingLoading, totalVotes, refetch };
}
