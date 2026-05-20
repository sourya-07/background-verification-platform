import { NextFunction, Request, Response } from "express";
import { verifyAuthToken } from "../utils/jwt";
import { Unauthorized } from "../utils/httpError";

/**
 * Extracts a Bearer token from the Authorization header, verifies it,
 * and attaches the decoded payload to `req.user`.
 *
 * Any failure — missing header, malformed token, expired token — comes
 * out as a 401. We never reveal the specific reason to the client.
 */
export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const header = req.header("authorization") ?? req.header("Authorization");
  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    return next(Unauthorized("Missing or malformed Authorization header"));
  }
  const token = header.slice(7).trim();
  if (!token) return next(Unauthorized("Missing token"));

  try {
    req.user = verifyAuthToken(token);
    next();
  } catch {
    next(Unauthorized("Invalid or expired token"));
  }
}
