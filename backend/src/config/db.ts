import { PrismaClient } from "@prisma/client";
import { isProduction } from "./env";

/**
 * A single PrismaClient instance is reused across the app. We cache the
 * client on `globalThis` in non-production environments so that hot
 * reloads (ts-node + nodemon) don't keep opening new connection pools
 * and exhaust the database.
 *
 * In production the module is loaded exactly once, so the global cache
 * just resolves to a fresh client.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProduction
      ? ["error"]
      : ["query", "warn", "error"],
  });

if (!isProduction) {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown — closes the pool when the process is terminated.
async function disconnect(): Promise<void> {
  await prisma.$disconnect();
}

process.on("beforeExit", disconnect);
process.on("SIGINT", async () => {
  await disconnect();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await disconnect();
  process.exit(0);
});
