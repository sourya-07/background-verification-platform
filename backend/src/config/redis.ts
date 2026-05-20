import IORedis, { Redis } from "ioredis";
import { env } from "./env";

/**
 * Optional Redis client.
 *
 * If REDIS_URL isn't set, this module exports `null` and every caller
 * (cache helpers, rate limiter) silently degrades to an in-memory path.
 * That's important because we don't want Redis to become a hard
 * dependency for someone trying the app out locally.
 *
 * When configured, we:
 *   - log a single line on first successful connection,
 *   - log a single warning when the connection drops (not on every retry),
 *   - keep `enableOfflineQueue: false` so requests fail fast instead of
 *     queuing forever when Redis is down.
 */

let client: Redis | null = null;
let available = false;

if (env.redisUrl) {
  client = new IORedis(env.redisUrl, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    retryStrategy(times: number): number {
      // Backoff up to 2s. ioredis will keep trying — that's fine, we
      // just don't want the first few seconds to be a tight loop.
      return Math.min(times * 200, 2000);
    },
  });

  client.on("ready", () => {
    if (!available) {
      available = true;
      // eslint-disable-next-line no-console
      console.log("[redis] connected");
    }
  });

  client.on("error", (err: Error) => {
    if (available) {
      available = false;
      // eslint-disable-next-line no-console
      console.warn("[redis] connection lost:", err.message);
    }
  });

  client.on("end", () => {
    available = false;
  });
}

export const redis = client;

export function isRedisAvailable(): boolean {
  return available;
}

/**
 * Wait until the Redis client emits `ready`, or until `timeoutMs` elapses.
 * Resolves either way — callers should follow up with `isRedisAvailable()`
 * to decide what to do. If no client is configured, resolves immediately.
 *
 * This is used at boot so we know whether Redis is reachable *before* we
 * wire up routes that try to construct a Redis-backed rate-limit store.
 * (`rate-limit-redis` fires SCRIPT LOAD in its constructor; with
 * `enableOfflineQueue: false` that rejects immediately if the client
 * isn't connected, which would otherwise crash the process at startup.)
 */
export function waitForRedis(timeoutMs: number): Promise<void> {
  if (!client) return Promise.resolve();
  if (available) return Promise.resolve();

  return new Promise((resolve) => {
    const done = (): void => {
      clearTimeout(timer);
      client?.off("ready", onReady);
      resolve();
    };
    const onReady = (): void => done();
    const timer = setTimeout(done, timeoutMs);
    client.once("ready", onReady);
  });
}
