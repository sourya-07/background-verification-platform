import type { Options as RateLimitOptions } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";

import { isRedisAvailable, redis } from "../config/redis";

/**
 * Returns a partial rate-limit config that uses Redis as the shared
 * store when Redis is available. If Redis isn't configured, returns
 * an empty object — express-rate-limit will then use its default
 * in-memory store.
 *
 * Spread the result into a `rateLimit({...})` config:
 *
 *   rateLimit({
 *     windowMs: 15 * 60 * 1000,
 *     limit: 100,
 *     ...redisStore("global"),
 *   })
 *
 * Each limiter should pass a unique `prefix` so their counters don't
 * collide in the shared Redis instance.
 */
export function redisStore(prefix: string): Partial<RateLimitOptions> {
  // Only attach the Redis-backed store if the client is actually connected.
  // Checking `redis != null` isn't enough: ioredis may be configured but
  // still mid-connect (or unreachable), and rate-limit-redis fires SCRIPT
  // LOAD eagerly from its constructor — with `enableOfflineQueue: false`
  // that produces an unhandled rejection that crashes the process at boot.
  // Boot waits briefly for Redis via `waitForRedis()`; if it hasn't connected
  // by the time routes load, we degrade to the default in-memory store.
  if (!redis || !isRedisAvailable()) return {};
  const client = redis;

  const store = new RedisStore({
    prefix: `bgv:rl:${prefix}:`,
    // ioredis' `.call(command, ...args)` is the lowest-level command
    // sender — it's what rate-limit-redis expects. The two libraries
    // disagree slightly on the function's signature (ioredis returns
    // `Promise<unknown>`, rate-limit-redis wants `Promise<RedisReply>`),
    // so we bridge them with a cast. At runtime the wire format is
    // identical.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendCommand: ((...args: string[]) => {
      const [command, ...rest] = args;
      return client.call(command, ...rest);
    }) as any,
  });

  // The constructor stores two SCRIPT LOAD promises on the instance and
  // never attaches a handler to them. They're consumed later by
  // `retryableIncrement`, but if Redis drops between construction and the
  // first request, those initial promises stay unhandled and crash Node.
  // Attach a no-op catch so the rejection is considered handled; the real
  // retry path inside the store will reload the script on demand.
  const tagged = store as unknown as {
    incrementScriptSha?: Promise<unknown>;
    getScriptSha?: Promise<unknown>;
  };
  tagged.incrementScriptSha?.catch?.(() => {});
  tagged.getScriptSha?.catch?.(() => {});

  return { store };
}
