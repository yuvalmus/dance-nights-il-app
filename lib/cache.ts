/**
 * Minimal in-memory cache with TTL.
 * Data lives only in RAM — no disk, no persistence across app restarts.
 */

type CacheEntry<T> = { data: T; expiry: number };

const store = new Map<string, CacheEntry<unknown>>();

/**
 * Returns cached data if fresh, otherwise calls fetchFn and caches the result.
 */
export async function cachedFetch<T>(
  key: string,
  ttl: number,
  fetchFn: () => Promise<T>,
): Promise<T> {
  const cached = store.get(key) as CacheEntry<T> | undefined;
  if (cached && Date.now() < cached.expiry) return cached.data;

  const data = await fetchFn();
  store.set(key, { data, expiry: Date.now() + ttl });
  return data;
}

/** Drop a single cache entry (call before refetch to force fresh data). */
export function invalidate(key: string) {
  store.delete(key);
}

/** Drop all cache entries whose key starts with the given prefix. */
export function invalidateByPrefix(prefix: string) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

/** Wipe all cached data (call on sign-out). */
export function clearCache() {
  store.clear();
}

export const TTL = {
  EVENTS: 15 * 60 * 1000,            // 15 min
  COURSES: 30 * 60 * 1000,           // 30 min
  POLL: 5 * 60 * 1000,               // 5 min
  PROFILE: 10 * 60 * 1000,           // 10 min
  VENUE: 30 * 60 * 1000,             // 30 min — venue ownership rarely changes
  VENUE_EVENTS: 5 * 60 * 1000,       // 5 min — venue owner checks events often
  AFFILIATIONS: 5 * 60 * 1000,       // 5 min — rare transitions, checked on focus
  NOTIFICATIONS: 2 * 60 * 1000,      // 2 min — short-lived, "inbox" style
  COURSE_APPROVAL: 2 * 60 * 1000,    // 2 min — venue-owner inbox
  ACTIVITY_SOCIAL: 2 * 60 * 1000,    // 2 min — going count + friends, changes often
  FRIENDS: 5 * 60 * 1000,            // 5 min — friend list
} as const;
