import { Router } from "express";
import rateLimit from "express-rate-limit";

import { login, register } from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { redisStore } from "../utils/rateLimitStore";
import {
  loginSchema,
  registerSchema,
} from "../validations/auth.validation";

const router = Router();

// Auth endpoints get an extra-tight limiter on top of the global one,
// because login is the main target for credential-stuffing bots. Uses
// the Redis store when available so the limit applies cluster-wide.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  ...redisStore("auth"),
});

router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  asyncHandler(register)
);

router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  asyncHandler(login)
);

export { router as authRouter };
