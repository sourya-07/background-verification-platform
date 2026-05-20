import dotenv from "dotenv";
import path from "path";

// Load .env from the backend root so it works no matter how the process
// is launched (ts-node, compiled dist, tests, etc.). Must run before
// validateEnv() reads process.env below.
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

/**
 * Variables that MUST be present at boot. We fail loudly on missing
 * values rather than discovering a misconfiguration at request time.
 */
const REQUIRED_ENV_VARS = ["DATABASE_URL", "JWT_SECRET", "PORT"] as const;

const MIN_JWT_SECRET_LENGTH = 32;

/**
 * Asserts every required env var is present and that JWT_SECRET is long
 * enough to be safe. Throws on failure. Exported so app.ts can call it
 * explicitly at startup, but also invoked at module load so importing
 * `env` is guaranteed to work or fail loudly.
 */
export function validateEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter((key) => {
    const value = process.env[key];
    return !value || value.trim() === "";
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
        `Check your .env file against .env.example`
    );
  }

  const secret = process.env.JWT_SECRET ?? "";
  if (secret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters long ` +
        `(current length: ${secret.length})`
    );
  }
}

// Validate before building the `env` object below. If anything is wrong,
// we surface a single combined error instead of failing on the first
// missing var.
validateEnv();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT),

  databaseUrl: process.env.DATABASE_URL as string,
  jwtSecret: process.env.JWT_SECRET as string,

  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",

  // Optional. When unset, the app uses an in-memory rate limiter and
  // skips Redis-backed caching. See config/redis.ts.
  redisUrl: process.env.REDIS_URL?.trim() || null,

  aadhaarApiUrl:
    process.env.AADHAAR_API_URL ??
    "http://localhost:5050/mock-api/aadhaar/verify",
  panApiUrl:
    process.env.PAN_API_URL ?? "http://localhost:5050/mock-api/pan/verify",
} as const;

export const isProduction = env.nodeEnv === "production";
