import { JwtPayload } from "../utils/jwt";

/**
 * Extend Express' Request so authenticated routes know about `req.user`.
 * The auth middleware populates this — never set it manually elsewhere.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export interface AadhaarVerifyResponse {
  status: "verified" | "failed";
  nameMatch?: boolean;
  dobMatch?: boolean;
  message: string;
}

export interface PanVerifyResponse {
  status: "verified" | "failed";
  panStatus?: "active" | "inactive";
  message: string;
}

export {};
