import { isRedisAvailable, redis } from "../config/redis";

/**
 * Thin caching helpers over the Redis client.
 *
 * Every function is safe to call when Redis isn't available — they
 * either return `null` (read) or no-op (write). That way callers can
 * use the cache opportunistically without branching on availability.
 *
 * Errors are swallowed deliberately: a cache failure should never
 * surface as a user-facing 500. The DB is always the source of truth.
 */

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis || !isRedisAvailable()) return null;
  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<void> {
  if (!redis || !isRedisAvailable()) return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // intentionally swallowed
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  if (!redis || !isRedisAvailable() || keys.length === 0) return;
  try {
    await redis.del(...keys);
  } catch {
    // intentionally swallowed
  }
}

// Keep keys centralized so we never typo a prefix and miss an
// invalidation. `bgv:` is the app namespace.
export const cacheKeys = {
  dashboardStats: (userId: string) => `bgv:stats:${userId}`,
} as const;

// Default TTL for the stats cache. Short enough that the dashboard
// feels live, long enough that a tight page-refresh loop isn't pure
// DB load.
export const STATS_TTL_SECONDS = 30;
