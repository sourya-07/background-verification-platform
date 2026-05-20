import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { env, isProduction, validateEnv } from "./config/env";
import { isRedisAvailable } from "./config/redis";
import { apiRouter } from "./routes";
import { mockRouter } from "./routes/mock.routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { redisStore } from "./utils/rateLimitStore";

export function createApp(): Application {
  // Belt-and-braces: env.ts already validates on module load, but we call
  // validateEnv() explicitly here so anyone reading createApp can see the
  // boot contract at a glance.
  validateEnv();

  const app = express();

  // Helmet first — sensible security headers on every response.
  app.use(helmet());

  // CORS is locked to the configured frontend origin in production. In
  // development we allow any origin so tools like curl, Postman, and
  // alternative dev ports work without ceremony. Methods and headers are
  // listed explicitly so the preflight contract is obvious.
  app.use(
    cors({
      origin: isProduction ? env.frontendOrigin : true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  );

  app.use(express.json({ limit: "1mb" }));

  // Global rate limit — 100 requests per 15 minutes per IP. When Redis
  // is configured we use it as the shared store so the limit applies
  // across multiple backend instances; otherwise we fall back to the
  // package's default in-memory store.
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 100,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      ...redisStore("global"),
    })
  );

  // Health check — useful for uptime monitors / k8s probes.
  app.get("/health", (_req, res) => {
    res.json({
      success: true,
      message: "ok",
      data: {
        uptime: process.uptime(),
        redis: isRedisAvailable() ? "connected" : "disabled",
      },
    });
  });

  // Two route trees: the real API and the mock third-party APIs. They
  // live under different prefixes so it's obvious in logs which is which.
  app.use("/api", apiRouter);
  app.use("/mock-api", mockRouter);

  // Anything that didn't match goes to the 404 handler, then the global
  // error handler. Order matters — errorHandler must be last.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
