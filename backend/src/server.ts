import { env } from "./config/env";
import { isRedisAvailable, waitForRedis } from "./config/redis";

async function main(): Promise<void> {
  // Give Redis a brief window to connect *before* we load the route
  // modules. Routes construct Redis-backed rate-limit stores at module
  // load time; if Redis isn't connected by then, those stores fall back
  // to in-memory (see utils/rateLimitStore.ts). Without this wait, the
  // routes import + Redis-connect race, and a slow/unreachable Redis
  // crashes the process via an unhandled rejection from SCRIPT LOAD.
  await waitForRedis(3000);
  if (!isRedisAvailable() && process.env.REDIS_URL) {
    // eslint-disable-next-line no-console
    console.warn(
      "[redis] not ready after 3s — rate limiting and caching will use in-memory fallbacks"
    );
  }

  // Dynamic import so the route modules (and their eager RedisStore
  // construction) only execute *after* the wait above.
  const { createApp } = await import("./app");
  const app = createApp();

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(
      `BGV backend listening on http://localhost:${env.port} (${env.nodeEnv})`
    );
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start backend:", err);
  process.exit(1);
});
