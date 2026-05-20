import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export interface JwtPayload {
  userId: string;
  email: string;
}

const DEFAULT_EXPIRY: SignOptions["expiresIn"] = "7d";

export function signAuthToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: DEFAULT_EXPIRY });
}

export function verifyAuthToken(token: string): JwtPayload {
  // jsonwebtoken returns string | JwtPayload; we only ever sign objects,
  // so narrow it here so the caller doesn't have to.
  const decoded = jwt.verify(token, env.jwtSecret);
  if (typeof decoded === "string") {
    throw new Error("Unexpected JWT payload");
  }
  return {
    userId: String(decoded.userId),
    email: String(decoded.email),
  };
}
